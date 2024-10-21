import { NextResponse } from "next/server";
import bodyParser from 'body-parser';
import crypto from 'crypto';

export async function POST(req) {
  try {
    const signature = req.headers.get("X-Hub-Signature", 'utf-8');
    console.log(`Signature: ${signature}`);

    if (!signature) {
      throw new Error("Missing X-Hub-Signature header");
    }

    const body = await req.json();
    const WEBHOOK_SECRET = process.env.OPTIMIZELY_WEBHOOK_SECRET || "";
    const hmac = crypto.createHmac('sha1', WEBHOOK_SECRET);
    // const webhookDigest = hmac.update(data).digest('hex');
    const webhookDigest = Buffer.from('sha1' + '=' + hmac.update(JSON.stringify(body)).digest('hex'), 'utf8');

    console.log(`webhookDigest: ${webhookDigest}`);
    console.log(`WEBHOOK_SECRET: ${WEBHOOK_SECRET}`);

    console.log(`Full body: ${JSON.stringify(body)}`);
    const computedSignature = Buffer.from(`sha1=${webhookDigest}`, 'utf-8');
    console.log(`computedSignature: ${computedSignature}`);
    const requestSignature = Buffer.from(signature);
    console.log(`requestSignature: ${requestSignature}`);

    if (computedSignature.length != requestSignature.length || !crypto.timingSafeEqual(computedSignature, requestSignature)) {
      throw new Error(`Invalid X-Hub-Signature header, Sent: ${signature}: Stored: ${process.env.OPTIMIZELY_WEBHOOK_SECRET}`);
    }

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

  const edgeConfigEndpoint = `https://api.vercel.com/v1/edge-config/${process.env.VERCEL_EDGE_CONFIG_ID}/items?teamId=${process.env.VERCEL_TEAM_ID}`;

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
