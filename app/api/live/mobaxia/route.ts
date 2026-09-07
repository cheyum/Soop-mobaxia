import { NextResponse } from "next/server";

const TARGET_BOARD_NAME = "𓍢ִ໋ 🌿바샤업UP..";
const TARGET_BOARD_KEYWORD = "바샤업UP";

function normalizeBoardName(value: unknown) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/\uFE0F/g, "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

export async function GET(request: Request) {
  try {
    // 현재 요청 주소에서 스트리머 ID 추출
    // 예: /api/posts/mobaxia → mobaxia
    const requestUrl = new URL(request.url);

    const pathParts = requestUrl.pathname
      .split("/")
      .filter(Boolean);

    const streamerId = decodeURIComponent(
      pathParts[pathParts.length - 1] || ""
    );

    if (!streamerId) {
      return NextResponse.json(
        {
          posts: [],
          error: true,
          message: "스트리머 ID가 없습니다.",
        },
        { status: 400 }
      );
    }

    const commonHeaders = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      Accept: "application/json, text/plain, */*",
      Referer:
        `https://www.sooplive.com/station/${streamerId}`,
    };

    // 1. 방송국 게시판 메뉴 목록 확인
    const menuUrl =
      `https://api-channel.sooplive.co.kr/v1.1/channel/` +
      `${encodeURIComponent(streamerId)}/menu`;

    const menuResponse = await fetch(menuUrl, {
      headers: commonHeaders,
      cache: "no-store",
    });

    if (!menuResponse.ok) {
      return NextResponse.json({
        id: streamerId,
        posts: [],
        error: true,
        message: `SOOP 게시판 메뉴 HTTP 오류 ${menuResponse.status}`,
      });
    }

    const menuText = await menuResponse.text();

    if (!menuText.trim()) {
      return NextResponse.json({
        id: streamerId,
        posts: [],
        error: true,
        message: "SOOP 게시판 메뉴 응답이 비어 있습니다.",
      });
    }

    let menuData: any;

    try {
      menuData = JSON.parse(menuText);
    } catch (error) {
      console.error("SOOP 게시판 메뉴 JSON 변환 실패:", error);

      return NextResponse.json({
        id: streamerId,
        posts: [],
        error: true,
        message: "SOOP 게시판 메뉴를 JSON으로 변환하지 못했습니다.",
      });
    }

    const boards = Array.isArray(menuData?.board)
      ? menuData.board
      : [];

    const normalizedTarget = normalizeBoardName(
      TARGET_BOARD_NAME
    );

    const normalizedKeyword = normalizeBoardName(
      TARGET_BOARD_KEYWORD
    );

    // 장식문자/공백 차이가 있어도 찾을 수 있도록
    // 정확히 일치 → 핵심 이름 포함 순서로 검색
    const targetBoard =
      boards.find(
        (board: any) =>
          normalizeBoardName(board?.name) ===
          normalizedTarget
      ) ??
      boards.find((board: any) =>
        normalizeBoardName(board?.name).includes(
          normalizedKeyword
        )
      );

    if (!targetBoard) {
      return NextResponse.json({
        id: streamerId,
        posts: [],
        error: true,
        message:
          `"${TARGET_BOARD_NAME}" 게시판을 찾지 못했습니다.`,
      });
    }

    const bbsNo =
      targetBoard.bbsNo ??
      targetBoard.bbs_no;

    if (bbsNo === undefined || bbsNo === null) {
      return NextResponse.json({
        id: streamerId,
        posts: [],
        error: true,
        message: "게시판 번호(bbsNo)를 찾지 못했습니다.",
      });
    }

    // 2. 해당 게시판 글 목록 조회
    const postsApiUrl = new URL(
      `https://chapi.sooplive.co.kr/api/` +
      `${encodeURIComponent(streamerId)}/board/`
    );

    postsApiUrl.searchParams.set("per_page", "20");
    postsApiUrl.searchParams.set("start_date", "");
    postsApiUrl.searchParams.set("end_date", "");
    postsApiUrl.searchParams.set(
      "field",
      "title,contents,user_nick,user_id,hashtags"
    );
    postsApiUrl.searchParams.set("keyword", "");
    postsApiUrl.searchParams.set("type", "all");
    postsApiUrl.searchParams.set("order_by", "reg_date");
    postsApiUrl.searchParams.set(
      "board_number",
      String(bbsNo)
    );
    postsApiUrl.searchParams.set("page", "1");

    const postsResponse = await fetch(
      postsApiUrl.toString(),
      {
        headers: commonHeaders,
        cache: "no-store",
      }
    );

    if (!postsResponse.ok) {
      return NextResponse.json({
        id: streamerId,
        boardName: targetBoard.name,
        bbsNo: String(bbsNo),
        posts: [],
        error: true,
        message: `SOOP 게시글 HTTP 오류 ${postsResponse.status}`,
      });
    }

    const postsText = await postsResponse.text();

    if (!postsText.trim()) {
      return NextResponse.json({
        id: streamerId,
        boardName: targetBoard.name,
        bbsNo: String(bbsNo),
        boardUrl:
          `https://www.sooplive.com/station/` +
          `${streamerId}/board/${bbsNo}`,
        posts: [],
        error: false,
      });
    }

    let postsData: any;

    try {
      postsData = JSON.parse(postsText);
    } catch (error) {
      console.error("SOOP 게시글 JSON 변환 실패:", error);

      return NextResponse.json({
        id: streamerId,
        posts: [],
        error: true,
        message: "SOOP 게시글을 JSON으로 변환하지 못했습니다.",
      });
    }

    const rawPosts = Array.isArray(postsData?.data)
      ? postsData.data
      : [];

    const posts = rawPosts
      .filter((post: any) => {
        const postBbsNo =
          post?.bbs_no ??
          post?.bbsNo;

        // board_number로 이미 필터링했지만 한 번 더 안전하게 확인
        return (
          postBbsNo === undefined ||
          postBbsNo === null ||
          String(postBbsNo) === String(bbsNo)
        );
      })
      .map((post: any) => {
        const titleNo =
          post?.title_no ??
          post?.titleNo ??
          post?.post_no ??
          post?.postNo ??
          post?.id;

        const title = String(
          post?.title ??
          post?.title_name ??
          post?.subject ??
          "제목 없는 글"
        ).trim();

        return {
          id: String(
            titleNo ??
            `${title}-${post?.reg_date ?? ""}`
          ),
          title,
          regDate:
            post?.reg_date ??
            post?.regDate ??
            "",
          url: titleNo
            ? `https://www.sooplive.com/station/${streamerId}/post/${titleNo}`
            : `https://www.sooplive.com/station/${streamerId}/board/${bbsNo}`,
        };
      })
      .sort((a: any, b: any) => {
        const aTime = new Date(a.regDate || 0).getTime();
        const bTime = new Date(b.regDate || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 4);

    return NextResponse.json({
      id: streamerId,
      boardName: targetBoard.name,
      bbsNo: String(bbsNo),
      boardUrl:
        `https://www.sooplive.com/station/` +
        `${streamerId}/board/${bbsNo}`,
      posts,
      error: false,
    });
  } catch (error) {
    console.error("SOOP UP해줘 게시판 조회 오류:", error);

    return NextResponse.json({
      posts: [],
      error: true,
      message:
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.",
    });
  }
}
