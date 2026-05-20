// app/api/trash-cleanup/route.js

import connectDB from "@/lib/connectDB";
import Note from "@/models/Note";

export async function GET() {
  try {
    await connectDB();

    // const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 5 * 60 * 1000); //5mins ago, for testing...

    const result = await Note.deleteMany({
      isTrash: true,
      trashedAt: {
        $lte: sevenDaysAgo,
      },
    });

    return Response.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error(err);

    return Response.json(
      {
        success: false,
      },
      {
        status: 500,
      },
    );
  }
}
