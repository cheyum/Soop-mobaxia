import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STREAMER_ID = "mobaxia";
const BOARD_NO = "124110231";
const BOARD_URL =
  "https://www.sooplive.com/station/mobaxia/board/124110231";
const MAX_POSTS = 4;
const POSTS_PER_PAGE = 50;
const MAX_FALLBACK_PAGES = 6;

type AnyRecord = Record<string, any>;

type LiveResult = {
  live: boolean;
  error: boolean;
  message?: string;
  source?: string;
};

type PostItem = {
  id: string;
  title: string;
  url: string;
  regDate?: string;
};

type PostsResult = {
  posts: PostItem[];
  error: boolean;
  message?: string;
  source?: string;
};

function makeHeaders(referer: string) {
  return {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
    Referer: referer,
  };
}

async function fetchText(url: string, referer: string) {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: makeHeaders(referer),
      cache: "no-store",
    });

    const text = await response.text();

    return {
      ok: response.ok,
      status: response.status,
      text,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      text: "",
      error:
        error instanceof Error ? error.message : "SOOP 요청에 실패했습니다.",
    };
  }
}

function safeJson(text: string): unknown {
  if (!text.trim()) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function getLiveStatus(): Promise<LiveResult> {
  const liveUrls = [
    `https://api-channel.sooplive.co.kr/v1.1/channel/${STREAMER_ID}/home/section/broad`,
    `https://api-channel.sooplive.com/v1.1/channel/${STREAMER_ID}/home/section/broad`,
  ];

  let lastMessage = "SOOP 방송 상태를 확인하지 못했습니다.";

  for (const url of liveUrls) {
    const result = await fetchText(
      url,
      `https://www.sooplive.com/station/${STREAMER_ID}`
    );

    if (result.status === 204 || result.status === 404) {
      return {
        live: false,
        error: false,
        source: url,
      };
    }

    if (!result.ok) {
      lastMessage = `SOOP LIVE API 오류 ${result.status || "NETWORK"}`;
      continue;
    }

    // 현재 SOOP 채널 broad API는 오프라인일 때 빈 본문을 반환할 수 있음
    if (!result.text.trim()) {
      return {
        live: false,
        error: false,
        source: url,
      };
    }

    const data = safeJson(result.text) as AnyRecord | null;

    if (!data || typeof data !== "object") {
      lastMessage = "SOOP LIVE 응답을 해석하지 못했습니다.";
      continue;
    }

    const broadNo =
      data?.broadNo ??
      data?.broad_no ??
      data?.broad?.broadNo ??
      data?.broad?.broad_no;

    return {
      live: broadNo !== undefined && broadNo !== null && String(broadNo) !== "",
      error: false,
      source: url,
    };
  }

  return {
    live: false,
    error: true,
    message: lastMessage,
  };
}

function looksLikePost(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const post = value as AnyRecord;

  return Boolean(
    post?.title_no ??
      post?.titleNo ??
      post?.post_no ??
      post?.postNo ??
      post?.title ??
      post?.subject
  );
}

function findPostArray(value: unknown, depth = 0): AnyRecord[] {
  if (depth > 6 || value == null) return [];

  if (Array.isArray(value)) {
    if (value.some(looksLikePost)) {
      return value.filter(looksLikePost) as AnyRecord[];
    }

    for (const child of value) {
      const found = findPostArray(child, depth + 1);
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

function getPostBoardNo(post: AnyRecord) {
  const value =
    post?.bbs_no ?? post?.bbsNo ?? post?.board_no ?? post?.boardNo ?? "";

  return String(value);
}

function getPostId(post: AnyRecord) {
  const value =
    post?.title_no ??
    post?.titleNo ??
    post?.post_no ??
    post?.postNo ??
    post?.id;

  return value === undefined || value === null ? "" : String(value);
}

function getPostTitle(post: AnyRecord) {
  return String(
    post?.title ?? post?.title_name ?? post?.subject ?? "제목 없는 글"
  ).trim();
}

function getPostDate(post: AnyRecord) {
  return String(
    post?.reg_date ??
      post?.regDate ??
      post?.created_at ??
      post?.createdAt ??
      ""
  );
}

function normalizePosts(rawPosts: AnyRecord[], directBoardRequest: boolean) {
  const seen = new Set<string>();

  const responseHasBoardNumber = rawPosts.some(
    (post) => getPostBoardNo(post) !== ""
  );

  return rawPosts
    .filter((post) => {
      if (!responseHasBoardNumber && directBoardRequest) {
        return true;
      }

      return getPostBoardNo(post) === BOARD_NO;
    })
    .map((post, index) => {
      const postId = getPostId(post);
      const title = getPostTitle(post);
      const regDate = getPostDate(post);
      const id = postId || `${title}-${regDate}-${index}`;

      return {
        id,
        title,
        regDate,
        url: postId
          ? `https://www.sooplive.com/station/${STREAMER_ID}/post/${encodeURIComponent(
              postId
            )}`
          : BOARD_URL,
        originalIndex: index,
      };
    })
    .filter((post) => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    })
    .sort((a, b) => {
      const aTime = new Date(a.regDate || "").getTime();
      const bTime = new Date(b.regDate || "").getTime();

      const aValid = Number.isFinite(aTime);
      const bValid = Number.isFinite(bTime);

      if (aValid && bValid) return bTime - aTime;
      return a.originalIndex - b.originalIndex;
    })
    .map(({ originalIndex, ...post }) => post);
}

async function fetchPostsPage(boardNumber: string, page: number) {
  const apiBases = [
    "https://chapi.sooplive.co.kr/api",
    "https://chapi.sooplive.com/api",
  ];

  let lastStatus = 0;
  let lastMessage = "SOOP 게시글 API 요청에 실패했습니다.";

  for (const base of apiBases) {
    const url = new URL(`${base}/${STREAMER_ID}/board/`);

    url.searchParams.set("per_page", String(POSTS_PER_PAGE));
    url.searchParams.set("start_date", "");
    url.searchParams.set("end_date", "");
    url.searchParams.set(
      "field",
      "title,contents,user_nick,user_id,hashtags"
    );
    url.searchParams.set("keyword", "");
    url.searchParams.set("type", "all");
    url.searchParams.set("order_by", "reg_date");
    url.searchParams.set("board_number", boardNumber);
    url.searchParams.set("page", String(page));

    const result = await fetchText(url.toString(), BOARD_URL);

    lastStatus = result.status;

    if (!result.ok) {
      lastMessage = `SOOP 게시글 API 오류 ${result.status || "NETWORK"}`;
      continue;
    }

    const data = safeJson(result.text);

    if (data === null && result.text.trim()) {
      lastMessage = "SOOP 게시글 응답을 JSON으로 변환하지 못했습니다.";
      continue;
    }

    return {
      ok: true,
      status: result.status,
      data,
      source: url.toString(),
    };
  }

  return {
    ok: false,
    status: lastStatus,
    data: null,
    message: lastMessage,
  };
}

async function getBoardPosts(): Promise<PostsResult> {
  // 1차: 정확한 게시판 번호로 직접 요청
  const direct = await fetchPostsPage(BOARD_NO, 1);

  if (direct.ok) {
    const rawPosts = findPostArray(direct.data);
    const posts = normalizePosts(rawPosts, true).slice(0, MAX_POSTS);

    if (posts.length > 0) {
      return {
        posts,
        error: false,
        source: direct.source,
      };
    }
  }

  // 2차: 전체 최신글을 페이지별로 읽은 뒤 bbs_no가 124110231인 글만 추출
  const matched: AnyRecord[] = [];
  let fallbackSource = "";

  for (let page = 1; page <= MAX_FALLBACK_PAGES; page += 1) {
    const fallback = await fetchPostsPage("", page);

    if (!fallback.ok) {
      if (page === 1) {
        return {
          posts: [],
          error: true,
          message: fallback.message || "SOOP 게시글 API 연결에 실패했습니다.",
        };
      }

      break;
    }

    fallbackSource = fallback.source || fallbackSource;

    const rawPosts = findPostArray(fallback.data);

    if (rawPosts.length === 0) break;

    matched.push(
      ...rawPosts.filter((post) => getPostBoardNo(post) === BOARD_NO)
    );

    if (matched.length >= MAX_POSTS) break;
    if (rawPosts.length < POSTS_PER_PAGE) break;
  }

  const posts = normalizePosts(matched, false).slice(0, MAX_POSTS);

  return {
    posts,
    error: false,
    source: fallbackSource || "all-board-fallback",
  };
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const debug = requestUrl.searchParams.get("debug") === "1";

  const [liveResult, postsResult] = await Promise.all([
    getLiveStatus(),
    getBoardPosts(),
  ]);

  const body: AnyRecord = {
    id: STREAMER_ID,
    boardNo: BOARD_NO,
    boardUrl: BOARD_URL,
    live: liveResult.live,
    liveError: liveResult.error,
    liveMessage: liveResult.message || "",
    posts: postsResult.posts,
    postsError: postsResult.error,
    postsMessage: postsResult.message || "",
  };

  if (debug) {
    body.debug = {
      liveSource: liveResult.source || "",
      postsSource: postsResult.source || "",
    };
  }

  return NextResponse.json(body, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
