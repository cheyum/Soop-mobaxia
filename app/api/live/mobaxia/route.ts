import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TARGET_BOARD_NAME = "𓍢ִ໋ 🌿바샤업UP..";
const TARGET_BOARD_KEYWORD = "바샤업UP";
const POSTS_PER_PAGE = 50;
const MAX_PAGES = 6;
const MAX_POSTS = 4;

type AnyRecord = Record<string, any>;

function normalizeBoardName(value: unknown) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\uFE0E\uFE0F]/g, "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

function getBoardName(board: AnyRecord) {
  return String(
    board?.name ??
      board?.bbsName ??
      board?.bbs_name ??
      board?.boardName ??
      board?.board_name ??
      board?.menuName ??
      board?.menu_name ??
      board?.title ??
      ""
  ).trim();
}

function getBbsNo(board: AnyRecord) {
  return (
    board?.bbsNo ??
    board?.bbs_no ??
    board?.boardNo ??
    board?.board_no ??
    null
  );
}

// SOOP 응답 구조가 조금 바뀌어도 bbsNo + 이름이 있는 객체를 찾도록 보조 검색
function collectBoardCandidates(value: unknown, result: AnyRecord[] = []) {
  if (!value || typeof value !== "object") {
    return result;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectBoardCandidates(item, result);
    }
    return result;
  }

  const record = value as AnyRecord;

  if (getBbsNo(record) !== null && getBoardName(record)) {
    result.push(record);
  }

  for (const child of Object.values(record)) {
    if (child && typeof child === "object") {
      collectBoardCandidates(child, result);
    }
  }

  return result;
}

function makeHeaders(streamerId: string, domain: "com" | "co.kr") {
  const origin =
    domain === "com"
      ? "https://www.sooplive.com"
      : "https://www.sooplive.co.kr";

  return {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
    Origin: origin,
    Referer: `${origin}/station/${streamerId}/board`,
  };
}

// SOOP 쪽에서 도메인별 Referer/Origin을 다르게 검사할 가능성에 대비해 2회 시도
async function fetchSoop(url: string, streamerId: string) {
  let lastResponse: Response | null = null;

  for (const domain of ["com", "co.kr"] as const) {
    const response = await fetch(url, {
      headers: makeHeaders(streamerId, domain),
      cache: "no-store",
    });

    lastResponse = response;

    if (response.ok) {
      return response;
    }

    // 인증/접근 계열 오류가 아니면 같은 URL을 굳이 한 번 더 요청하지 않음
    if (![401, 403, 429].includes(response.status)) {
      break;
    }
  }

  return lastResponse;
}

function jsonResponse(body: AnyRecord, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const pathParts = requestUrl.pathname.split("/").filter(Boolean);
    const streamerId = decodeURIComponent(
      pathParts[pathParts.length - 1] || ""
    );

    if (!streamerId) {
      return jsonResponse(
        {
          posts: [],
          error: true,
          message: "스트리머 ID가 없습니다.",
        },
        400
      );
    }

    // --------------------------------------------------
    // 1) 방송국 게시판 메뉴에서 바샤업UP 게시판 번호 찾기
    // --------------------------------------------------
    const menuUrl =
      `https://api-channel.sooplive.co.kr/v1.1/channel/` +
      `${encodeURIComponent(streamerId)}/menu`;

    const menuResponse = await fetchSoop(menuUrl, streamerId);

    if (!menuResponse || !menuResponse.ok) {
      return jsonResponse({
        id: streamerId,
        posts: [],
        error: true,
        message: `SOOP 게시판 메뉴 HTTP 오류 ${
          menuResponse?.status ?? "UNKNOWN"
        }`,
      });
    }

    const menuText = await menuResponse.text();

    if (!menuText.trim()) {
      return jsonResponse({
        id: streamerId,
        posts: [],
        error: true,
        message: "SOOP 게시판 메뉴 응답이 비어 있습니다.",
      });
    }

    let menuData: AnyRecord;

    try {
      menuData = JSON.parse(menuText);
    } catch (error) {
      console.error("SOOP 게시판 메뉴 JSON 변환 실패:", error);

      return jsonResponse({
        id: streamerId,
        posts: [],
        error: true,
        message: "SOOP 게시판 메뉴를 JSON으로 변환하지 못했습니다.",
      });
    }

    const directBoards = Array.isArray(menuData?.board)
      ? menuData.board
      : Array.isArray(menuData?.data?.board)
        ? menuData.data.board
        : [];

    const boards =
      directBoards.length > 0
        ? directBoards
        : collectBoardCandidates(menuData);

    const normalizedTarget = normalizeBoardName(TARGET_BOARD_NAME);
    const normalizedKeyword = normalizeBoardName(TARGET_BOARD_KEYWORD);

    const targetBoard =
      boards.find(
        (board: AnyRecord) =>
          normalizeBoardName(getBoardName(board)) === normalizedTarget
      ) ??
      boards.find((board: AnyRecord) =>
        normalizeBoardName(getBoardName(board)).includes(normalizedKeyword)
      );

    if (!targetBoard) {
      return jsonResponse({
        id: streamerId,
        posts: [],
        error: true,
        message: `"${TARGET_BOARD_NAME}" 게시판을 찾지 못했습니다.`,
        availableBoards: boards
          .map((board: AnyRecord) => ({
            name: getBoardName(board),
            bbsNo: getBbsNo(board),
          }))
          .filter((board: AnyRecord) => board.name && board.bbsNo != null),
      });
    }

    const bbsNo = getBbsNo(targetBoard);
    const boardName = getBoardName(targetBoard) || TARGET_BOARD_NAME;

    if (bbsNo === null || bbsNo === undefined || bbsNo === "") {
      return jsonResponse({
        id: streamerId,
        posts: [],
        error: true,
        message: "바샤업UP 게시판 번호(bbsNo)를 찾지 못했습니다.",
      });
    }

    const boardUrl =
      `https://www.sooplive.com/station/` +
      `${encodeURIComponent(streamerId)}/board/${encodeURIComponent(
        String(bbsNo)
      )}`;

    // --------------------------------------------------
    // 2) 전체 게시글 API를 최신순으로 조회한 뒤 bbs_no로 필터링
    //    SOOP 실제 사용 예시도 board_number를 비워두고 가져온 뒤
    //    post.bbs_no와 board.bbsNo를 비교하는 방식임.
    // --------------------------------------------------
    const matchedPosts: AnyRecord[] = [];
    const seen = new Set<string>();

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const postsApiUrl = new URL(
        `https://chapi.sooplive.co.kr/api/` +
          `${encodeURIComponent(streamerId)}/board/`
      );

      postsApiUrl.searchParams.set("per_page", String(POSTS_PER_PAGE));
      postsApiUrl.searchParams.set("start_date", "");
      postsApiUrl.searchParams.set("end_date", "");
      postsApiUrl.searchParams.set(
        "field",
        "title,contents,user_nick,user_id,hashtags"
      );
      postsApiUrl.searchParams.set("keyword", "");
      postsApiUrl.searchParams.set("type", "all");
      postsApiUrl.searchParams.set("order_by", "reg_date");
      postsApiUrl.searchParams.set("board_number", "");
      postsApiUrl.searchParams.set("page", String(page));

      const postsResponse = await fetchSoop(
        postsApiUrl.toString(),
        streamerId
      );

      if (!postsResponse || !postsResponse.ok) {
        return jsonResponse({
          id: streamerId,
          boardName,
          bbsNo: String(bbsNo),
          boardUrl,
          posts: [],
          error: true,
          message: `SOOP 게시글 HTTP 오류 ${
            postsResponse?.status ?? "UNKNOWN"
          }`,
        });
      }

      const postsText = await postsResponse.text();

      if (!postsText.trim()) {
        break;
      }

      let postsData: AnyRecord;

      try {
        postsData = JSON.parse(postsText);
      } catch (error) {
        console.error("SOOP 게시글 JSON 변환 실패:", error);

        return jsonResponse({
          id: streamerId,
          boardName,
          bbsNo: String(bbsNo),
          boardUrl,
          posts: [],
          error: true,
          message: "SOOP 게시글을 JSON으로 변환하지 못했습니다.",
        });
      }

      const rawPosts = Array.isArray(postsData?.data)
        ? postsData.data
        : Array.isArray(postsData?.response?.data)
          ? postsData.response.data
          : [];

      for (const post of rawPosts) {
        const postBbsNo =
          post?.bbs_no ?? post?.bbsNo ?? post?.board_no ?? post?.boardNo;

        if (String(postBbsNo ?? "") !== String(bbsNo)) {
          continue;
        }

        const titleNo =
          post?.title_no ??
          post?.titleNo ??
          post?.post_no ??
          post?.postNo ??
          post?.id;

        const title = String(
          post?.title ?? post?.title_name ?? post?.subject ?? "제목 없는 글"
        ).trim();

        const uniqueKey = String(
          titleNo ?? `${title}-${post?.reg_date ?? post?.regDate ?? ""}`
        );

        if (seen.has(uniqueKey)) {
          continue;
        }

        seen.add(uniqueKey);

        matchedPosts.push({
          id: uniqueKey,
          title,
          regDate: post?.reg_date ?? post?.regDate ?? "",
          url: titleNo
            ? `https://www.sooplive.com/station/${encodeURIComponent(
                streamerId
              )}/post/${encodeURIComponent(String(titleNo))}`
            : boardUrl,
        });
      }

      if (matchedPosts.length >= MAX_POSTS) {
        break;
      }

      if (rawPosts.length < POSTS_PER_PAGE) {
        break;
      }
    }

    const posts = matchedPosts
      .sort((a: AnyRecord, b: AnyRecord) => {
        const aTime = new Date(a.regDate || 0).getTime();
        const bTime = new Date(b.regDate || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, MAX_POSTS);

    return jsonResponse({
      id: streamerId,
      boardName,
      bbsNo: String(bbsNo),
      boardUrl,
      posts,
      error: false,
    });
  } catch (error) {
    console.error("SOOP UP해줘 게시판 조회 오류:", error);

    return jsonResponse({
      posts: [],
      error: true,
      message:
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.",
    });
  }
}
