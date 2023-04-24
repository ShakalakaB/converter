// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  if (req.method !== "POST") {
    res.status(405).send({ message: "only POST method allowed" });
    return;
  }
  console.log(req.body);
  res.status(200).json(req.body);
}
