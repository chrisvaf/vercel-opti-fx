import { NextResponse } from "next/server";
import type { Readable } from 'node:stream';
import { headers } from 'next/headers';

import crypto from 'crypto';
import { NextApiRequest } from "next";

/*export const config = {
  api: {
      bodyParser: false
  }
};*/

async function getRawBody(readable: Readable): Promise<Buffer> {
  const chunks:any = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function POST(req: Request) {
  try {
    const headersList = await headers();

    const signature = headersList.get("X-Hub-Signature");
    
    if (!signature) {
      throw new Error("Missing X-Hub-Signature header");
    }

    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    const WEBHOOK_SECRET = process.env.OPTIMIZELY_WEBHOOK_SECRET || "";
    const hmac = crypto.createHmac('sha1', WEBHOOK_SECRET);
    console.log(`hmac: ${hmac}`);
    const webhookDigest = hmac.update(rawBody).digest('hex');
    
    const computedSignature = Buffer.from(`sha1=${webhookDigest}`, 'utf-8');
    const requestSignature = Buffer.from(signature, 'utf-8');
    
    if (computedSignature.length != requestSignature.length || !crypto.timingSafeEqual(computedSignature, requestSignature)) {
      //throw new Error(`Invalid X-Hub-Signature header, Sent: ${signature}: Stored: ${process.env.OPTIMIZELY_WEBHOOK_SECRET}`);
    }

    //const data = await JSON.parse(body.data);
    //var data = JSON.parse(body.data);
    console.log(`Data: ${body.data}`);
    if (!body?.data?.origin_url || !body?.data?.environment) {
      throw new Error("Missing datafile webhook payload");
    }

    if (body.data.environment !== "Production") {
      return NextResponse.json(
        { success: true, message: "Pre-production environment event" },
        { status: 200 }
      );
    }

    const response = await fetch(body.data.origin_url);

    if (!response.ok) {
      throw new Error(`Failed to fetch JSON Optimizely CDN`);
    }

    const datafile = await response.json();

    await updateEdgeConfig(datafile);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

async function updateEdgeConfig(datafile: any) {
  if (!process.env.VERCEL_EDGE_CONFIG_ID) {
    throw new Error("Missing VERCEL_EDGE_CONFIG_ID");
  }

  if (!process.env.VERCEL_TEAM_ID) {
    throw new Error("Missing VERCEL_TEAM_ID");
  }

  if (!process.env.VERCEL_API_TOKEN) {
    throw new Error("Missing VERCEL_API_TOKEN");
  }

  console.log(`datafile: ${datafile}`);

  const edgeConfigEndpoint = `https://api.vercel.com/v1/edge-config/${process.env.VERCEL_EDGE_CONFIG_ID}/items?teamId=${process.env.VERCEL_TEAM_ID}`;

  console.log(JSON.stringify({
    items: [
      {
        operation: "upsert",
        key: "datafile",
        value: datafile,
      },
    ],
  }));

  return await fetch(edgeConfigEndpoint, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          operation: "upsert",
          key: "datafile",
          value: datafile,
        },
      ],
    }),
  });
}
