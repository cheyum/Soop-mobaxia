import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const POSTS_PER_PAGE = 50;
const MAX_FALLBACK_PAGES = 10;
const MAX_POSTS = 4;

type AnyRecord = Record<string, any>;

type FetchResult = {
  response: Response | null;
  url: string;
  error?: string;
};

function jsonResponse(body: AnyRecord, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

function extractBoardInfo(rawBoardUrl: string, streamerId: string) {
  try {
    const url = new URL(rawBoardUrl);
    const host = url.hostname.toLowerCase();

    if (
      host !== "www.sooplive.com" &&
      host !== "sooplive.com" &&
      host !== "www.sooplive.co.kr" &&
      host !== "sooplive.co.kr"
    ) {
      return null;
    }

    const parts = url.pathname.split("/").filter(Boolean);
    const stationIndex = parts.indexOf("station");
    const boardIndex = parts.indexOf("board");

    if (stationIndex < 0 || boardIndex < 0) {
      return null;
    }

    const urlStreamerId = decodeURIComponent(parts[stationIndex + 1] || "");
    const bbsNo = decodeURIComponent(parts[boardIndex + 1] || "");

    if (!urlStreamerId || !bbsNo) {
      return null;
    }

    if (urlStreamerId.toLowerCase() !== streamerId.toLowerCase()) {
      return null;
    }

    return {
      bbsNo,
      boardUrl: `https://www.sooplive.com/station/${encodeURIComponent(
        streamerId
      )}/board/${encodeURIComponent(bbsNo)}`,
    };
  } catch {
    return null;
  }
}

function makeHeaders(boardUrl: string) {
  return {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
    Referer: boardUrl,
  };
}

async function fetchBoardApi(
  streamerId: string,
  boardUrl: string,
  bbsNo: string,
  page: number,
  filterByBoardNumber: boolean
): Promise<FetchResult> {
  // 2026년 현재 SOOP 서비스가 .com 계열로 이동하는 중이라
  // .com을 먼저 시도하고, 실패하면 기존 .co.kr 주소도 시도합니다.
  const bases = [
    "https://chapi.sooplive.com/api",
    "https://chapi.sooplive.co.kr/api",
  ];

  let lastResponse: Response | null = null;
  let lastUrl = "";
  let lastError = "";

  for (const base of bases) {
    const apiUrl = new URL(
      `${base}/${encodeURIComponent(streamerId)}/board/`
    );

    apiUrl.searchParams.set("per_page", String(POSTS_PER_PAGE));
    apiUrl.searchParams.set("start_date", "");
    apiUrl.searchParams.set("end_date", "");
    apiUrl.searchParams.set(
      "field",
      "title,contents,user_nick,user_id,hashtags"
    );
    apiUrl.searchParams.set("keyword", "");
    apiUrl.searchParams.set("type", "all");
    apiUrl.searchParams.set("order_by", "reg_date");
    apiUrl.searchParams.set(
      "board_number",
      filterByBoardNumber ? bbsNo : ""
    );
    apiUrl.searchParams.set("page", String(page));

    lastUrl = apiUrl.toString();

    try {
      const response = await fetch(lastUrl, {
        method: "GET",
        headers: makeHeaders(boardUrl),
        cache: "no-store",
      });

      lastResponse = response;

      if (response.ok) {
        return { response, url: lastUrl };
      }

      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : "SOOP API 요청 실패";
    }
  }

  return {
    response: lastResponse,
    url: lastUrl,
    error: lastError || "SOOP API 요청 실패",
  };
}

function looksLikePost(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const post = value as AnyRecord;

  return Boolean(
    post.title_no ??
      post.titleNo ??
      post.post_no ??
      post.postNo ??
      post.bbs_no ??
      post.bbsNo ??
      post.title ??
      post.subject
  );
}

function findPostArray(value: unknown, depth = 0): AnyRecord[] {
  if (depth > 6 || value == null) {
    return [];
  }

  if (Array.isArray(value)) {
    if (value.some(looksLikePost)) {
      return value.filter(looksLikePost) as AnyRecord[];
    }

    for (const item of value) {
      const found = findPostArray(item, depth + 1);
      if (found.length > 0) return found;
    }

    return [];
  }

  if (typeof value === "object") {
    for (const child of Object.values(value as AnyRecord)) {
      const found = findPostArray(child, depth + 1);
      if (found.length > 0) return found;
    }
  }

  return [];
}

function getPostBbsNo(post: AnyRecord) {
  return String(
    post?.bbs_no ?? post?.bbsNo ?? post?.board_no ?? post?.boardNo ?? ""
  );
}

function getTitleNo(post: AnyRecord) {
  const value =
    post?.title_no ??
    post?.titleNo ??
    post?.post_no ??
    post?.postNo ??
    post?.id;

  return value == null ? "" : String(value);
}

function getPostTitle(post: AnyRecord) {
  return String(
    post?.title ?? post?.title_name ?? post?.subject ?? "제목 없는 글"
  ).trim();
}

function getRegDate(post: AnyRecord) {
  return String(
    post?.reg_date ??
      post?.regDate ??
      post?.created_at ??
      post?.createdAt ??
      ""
  );
}

function normalizePosts(
  rawPosts: AnyRecord[],
  streamerId: string,
  bbsNo: string,
  boardUrl: string,
  forceBoardMatch = false
) {
  const seen = new Set<string>();

  return rawPosts
    .filter((post) => {
      if (forceBoardMatch) return true;
      return getPostBbsNo(post) === String(bbsNo);
    })
    .map((post) => {
      const titleNo = getTitleNo(post);
      const title = getPostTitle(post);
      const regDate = getRegDate(post);
      const id = titleNo || `${title}-${regDate}`;

      return {
        id,
        title,
        regDate,
        url: titleNo
          ? `https://www.sooplive.com/station/${encodeURIComponent(
              streamerId
            )}/post/${encodeURIComponent(titleNo)}`
          : boardUrl,
      };
    })
    .filter((post) => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    })
    .sort((a, b) => {
      const aTime = new Date(a.regDate || 0).getTime();
      const bTime = new Date(b.regDate || 0).getTime();

      if (Number.isNaN(aTime) || Number.isNaN(bTime)) return 0;
      return bTime - aTime;
    });
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  if (!text.trim()) {
    return { data: null as unknown, text: "" };
  }

  try {
    return {
      data: JSON.parse(text) as unknown,
      text,
    };
  } catch {
    return {
      data: null as unknown,
      text,
    };
  }
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

    const rawBoardUrl = requestUrl.searchParams.get("boardUrl") || "";
    const boardInfo = extractBoardInfo(rawBoardUrl, streamerId);

    if (!boardInfo) {
      return jsonResponse(
        {
          id: streamerId,
          posts: [],
          error: true,
          message:
            "UP해줘 게시판 주소에서 게시판 번호를 확인하지 못했습니다.",
        },
        400
      );
    }

    const { bbsNo, boardUrl } = boardInfo;

    // --------------------------------------------------
    // 1차: board_number에 정확한 게시판 번호를 넣어서 직접 조회
    // --------------------------------------------------
    const directResult = await fetchBoardApi(
      streamerId,
      boardUrl,
      bbsNo,
      1,
      true
    );

    if (directResult.response?.ok) {
      const { data } = await readJsonResponse(directResult.response);
      const rawPosts = findPostArray(data);

      if (rawPosts.length > 0) {
        // 응답에 bbs_no가 있으면 실제로 목표 게시판인지 한 번 더 검증합니다.
        // bbs_no 자체가 없는 응답일 때만 board_number 필터가 적용됐다고 보고 허용합니다.
        const responseHasBoardNo = rawPosts.some(
          (post) => getPostBbsNo(post) !== ""
        );

        const posts = normalizePosts(
          rawPosts,
          streamerId,
          bbsNo,
          boardUrl,
          !responseHasBoardNo
        ).slice(0, MAX_POSTS);

        if (posts.length > 0) {
          return jsonResponse({
            id: streamerId,
            bbsNo,
            boardUrl,
            posts,
            error: false,
            source: "direct-board",
          });
        }
      }
    }

    // --------------------------------------------------
    // 2차 fallback: 전체 게시글을 가져와 bbs_no로 직접 필터링
    // --------------------------------------------------
    const matched: AnyRecord[] = [];

    for (let page = 1; page <= MAX_FALLBACK_PAGES; page += 1) {
      const fallbackResult = await fetchBoardApi(
        streamerId,
        boardUrl,
        bbsNo,
        page,
        false
      );

      if (!fallbackResult.response?.ok) {
        if (page === 1) {
          return jsonResponse({
            id: streamerId,
            bbsNo,
            boardUrl,
            posts: [],
            error: true,
            message: `SOOP 게시글 API 연결 실패: ${
              fallbackResult.error || "응답 없음"
            }`,
          });
        }

        break;
      }

      const { data } = await readJsonResponse(fallbackResult.response);
      const rawPosts = findPostArray(data);

      if (rawPosts.length === 0) {
        break;
      }

      const pageMatches = rawPosts.filter(
        (post) => getPostBbsNo(post) === String(bbsNo)
      );

      matched.push(...pageMatches);

      if (matched.length >= MAX_POSTS) {
        break;
      }

      if (rawPosts.length < POSTS_PER_PAGE) {
        break;
      }
    }

    const posts = normalizePosts(
      matched,
      streamerId,
      bbsNo,
      boardUrl,
      true
    ).slice(0, MAX_POSTS);

    return jsonResponse({
      id: streamerId,
      bbsNo,
      boardUrl,
      posts,
      error: false,
      source: "all-board-fallback",
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
