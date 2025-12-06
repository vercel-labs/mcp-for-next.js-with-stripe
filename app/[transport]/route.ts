import { createMcpHandler } from "@vercel/mcp-adapter";
import { z } from "zod";

import { registerPaidTool } from "@stripe/agent-toolkit/modelcontextprotocol";
import { withAuth } from "@/lib/withAuth";

const generateImage = async (_prompt: string) => {
  return "https://example.com/image.png";
};

const handlerWithAuth = withAuth((request) => {
  const email = request.headers.get("x-user-email");

  return createMcpHandler(
    async (server) => {
      server.tool(
        "echo",
        "Echo a message",
        { message: z.string() },
        async ({ message }) => ({
          content: [{ type: "text", text: `Tool echo: ${message}` }],
        })
      );

      registerPaidTool(
        server as unknown as Parameters<typeof registerPaidTool>[0],
        "generate_image",
        "Generate an image",
        {
          prompt: z.string(),
        },
        async ({ prompt }) => {
          const imageUrl = await generateImage(prompt);
          return {
            content: [{ type: "image", data: imageUrl, mimeType: "image/png" }],
          };
        },
        {
          paymentReason: "Generate an image",
          stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
          userEmail: email ?? "",
          successUrl: "https://example.com/success",
          priceId: process.env.STRIPE_PRICE_ID ?? "",
        }
      );
    },
    {
      capabilities: {
        tools: {
          echo: {
            description: "Echo a message",
          },
        },
      },
    },
    {
      redisUrl: process.env.REDIS_URL,
      basePath: "",
      verboseLogs: false,
      maxDuration: 60,
    }
  )(request);
});

export {
  handlerWithAuth as GET,
  handlerWithAuth as POST,
  handlerWithAuth as DELETE,
};
