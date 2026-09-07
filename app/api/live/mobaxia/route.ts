import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BOARD_NO = "124110231";

const BOARD_URL =
  "https://www.sooplive.com/station/mobaxia/board/124110231";

const MAX_POSTS = 4;
const POSTS_PER_PAGE = 50;
const MAX_PAGES = 10;

type AnyRecord = Record<string, any>;

function jsonResponse(data: AnyRecord) {
  return NextResponse.json(data, {
    status: 200,
    headers: {
      "Cache-Control":
        "no-store, no-cache, must-revalidate",
    },
  });
}

function safeJson(text: string): AnyRecord | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/* =========================================
   LIVE 상태 조회
========================================= */

async function getLiveStatus(streamerId: string) {
  const urls = [
    "https://live.sooplive.com/afreeca/player_live_api.php",
    "https://live.sooplive.co.kr/afreeca/player_live_api.php",
  ];

  let lastStatus = 0;
  let lastMessage = "";

  for (const url of urls) {
    try {
      const body = new URLSearchParams({
        bid: streamerId,
        bno: "null",
        type: "live",
        pwd: "",
        player_type: "html5",
        stream_type: "common",
        quality: "HD",
        mode: "landing",
        from_api: "0",
        is_revive: "false",
      });

      const response = await fetch(url, {
        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",

          Accept:
            "application/json, text/plain, */*",

          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152.0.0.0 Safari/537.36",

          Referer:
            `https://play.sooplive.com/${streamerId}`,
        },

        body: body.toString(),

        cache: "no-store",
      });

      lastStatus = response.status;

      const text = await response.text();

      if (!response.ok) {
        lastMessage =
          `LIVE API HTTP ${response.status}`;

        continue;
      }

      if (!text.trim()) {
        lastMessage =
          "LIVE API 응답이 비어 있습니다.";

        continue;
      }

      const data = safeJson(text);

      if (!data) {
        lastMessage =
          "LIVE API JSON 변환 실패";

        continue;
      }

      const channel =
        data?.CHANNEL ?? {};

      const broadNo =
        channel?.BNO;

      const live =
        broadNo !== undefined &&
        broadNo !== null &&
        String(broadNo) !== "" &&
        String(broadNo) !== "0";

      return {
        live,
        error: false,
        status: response.status,
        broadNo:
          broadNo != null
            ? String(broadNo)
            : "",
        source: url,
      };
    } catch (error) {
      lastMessage =
        error instanceof Error
          ? error.message
          : "LIVE API 연결 실패";
    }
  }

  return {
    live: false,
    error: true,
    status: lastStatus,
    message:
      lastMessage ||
      "방송 상태를 확인하지 못했습니다.",
  };
}

/* =========================================
   게시글 배열 찾기
========================================= */

function looksLikePost(value: unknown) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const post =
    value as AnyRecord;

  return Boolean(
    post?.title_no ??
      post?.titleNo ??
      post?.post_no ??
      post?.postNo ??
      post?.title ??
      post?.subject
  );
}

function findPostArray(
  value: unknown,
  depth = 0
): AnyRecord[] {
  if (
    value == null ||
    depth > 6
  ) {
    return [];
  }

  if (Array.isArray(value)) {
    if (value.some(looksLikePost)) {
      return value.filter(
        looksLikePost
      ) as AnyRecord[];
    }

    for (const child of value) {
      const result =
        findPostArray(
          child,
          depth + 1
        );

      if (result.length > 0) {
        return result;
      }
    }

    return [];
  }

  if (
    typeof value ===
    "object"
  ) {
    for (
      const child
      of Object.values(
        value as AnyRecord
      )
    ) {
      const result =
        findPostArray(
          child,
          depth + 1
        );

      if (result.length > 0) {
        return result;
      }
    }
  }

  return [];
}

/* =========================================
   게시판 게시글 한 페이지 조회
========================================= */

async function getPostsPage(
  streamerId: string,
  page: number,
  boardNumber: string
) {
  const bases = [
    "https://chapi.sooplive.co.kr/api",
    "https://chapi.sooplive.com/api",
  ];

  let lastStatus = 0;
  let lastMessage = "";

  for (const base of bases) {
    const url = new URL(
      `${base}/${encodeURIComponent(
        streamerId
      )}/board/`
    );

    url.searchParams.set(
      "per_page",
      String(POSTS_PER_PAGE)
    );

    url.searchParams.set(
      "start_date",
      ""
    );

    url.searchParams.set(
      "end_date",
      ""
    );

    url.searchParams.set(
      "field",
      "title,contents,user_nick,user_id,hashtags"
    );

    url.searchParams.set(
      "keyword",
      ""
    );

    url.searchParams.set(
      "type",
      "all"
    );

    url.searchParams.set(
      "order_by",
      "reg_date"
    );

    url.searchParams.set(
      "board_number",
      boardNumber
    );

    url.searchParams.set(
      "page",
      String(page)
    );

    try {
      const response =
        await fetch(
          url.toString(),
          {
            headers: {
              Accept:
                "application/json, text/plain, */*",

              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152.0.0.0 Safari/537.36",

              Referer:
                `https://www.sooplive.com/station/${streamerId}`,

              Origin:
                "https://www.sooplive.com",
            },

            cache:
              "no-store",
          }
        );

      lastStatus =
        response.status;

      const text =
        await response.text();

      if (!response.ok) {
        lastMessage =
          `게시글 API HTTP ${response.status}`;

        continue;
      }

      if (!text.trim()) {
        return {
          ok: true,
          status:
            response.status,
          posts: [] as AnyRecord[],
          source:
            url.toString(),
        };
      }

      const data =
        safeJson(text);

      if (!data) {
        lastMessage =
          "게시글 API JSON 변환 실패";

        continue;
      }

      const posts =
        findPostArray(data);

      return {
        ok: true,
        status:
          response.status,
        posts,
        source:
          url.toString(),
      };
    } catch (error) {
      lastMessage =
        error instanceof Error
          ? error.message
          : "게시글 API 연결 실패";
    }
  }

  return {
    ok: false,
    status:
      lastStatus,
    posts: [] as AnyRecord[],
    message:
      lastMessage ||
      "게시글 API 연결 실패",
  };
}

/* =========================================
   게시글 정보 추출
========================================= */

function getBoardNo(
  post: AnyRecord
) {
  return String(
    post?.bbs_no ??
      post?.bbsNo ??
      post?.board_no ??
      post?.boardNo ??
      ""
  );
}

function getPostNo(
  post: AnyRecord
) {
  const value =
    post?.title_no ??
    post?.titleNo ??
    post?.post_no ??
    post?.postNo ??
    post?.id;

  return value == null
    ? ""
    : String(value);
}

function getPostTitle(
  post: AnyRecord
) {
  return String(
    post?.title ??
      post?.title_name ??
      post?.subject ??
      "제목 없는 글"
  ).trim();
}

function getPostDate(
  post: AnyRecord
) {
  return String(
    post?.reg_date ??
      post?.regDate ??
      post?.created_at ??
      post?.createdAt ??
      ""
  );
}

/* =========================================
   UP해줘 게시글 조회
========================================= */

async function getBoardPosts(
  streamerId: string
) {
  /*
    1차:
    board_number에 정확한 게시판 번호 입력
  */

  const direct =
    await getPostsPage(
      streamerId,
      1,
      BOARD_NO
    );

  if (
    direct.ok &&
    direct.posts.length > 0
  ) {
    const hasBoardNo =
      direct.posts.some(
        (post) =>
          getBoardNo(post) !== ""
      );

    const filtered =
      hasBoardNo
        ? direct.posts.filter(
            (post) =>
              getBoardNo(post) ===
              BOARD_NO
          )
        : direct.posts;

    if (
      filtered.length > 0
    ) {
      return {
        posts:
          normalizePosts(
            filtered,
            streamerId
          ).slice(
            0,
            MAX_POSTS
          ),

        error: false,

        source:
          direct.source,
      };
    }
  }

  /*
    2차:
    전체 게시글을 불러온 뒤
    bbs_no === 124110231 필터
  */

  const matched:
    AnyRecord[] = [];

  let lastStatus = 0;
  let lastMessage = "";
  let source = "";

  for (
    let page = 1;
    page <= MAX_PAGES;
    page += 1
  ) {
    const result =
      await getPostsPage(
        streamerId,
        page,
        ""
      );

    lastStatus =
      result.status;

    if (!result.ok) {
      lastMessage =
        result.message ||
        "게시글 API 연결 실패";

      break;
    }

    source =
      result.source ||
      source;

    if (
      result.posts.length === 0
    ) {
      break;
    }

    matched.push(
      ...result.posts.filter(
        (post) =>
          getBoardNo(post) ===
          BOARD_NO
      )
    );

    if (
      matched.length >=
      MAX_POSTS
    ) {
      break;
    }

    if (
      result.posts.length <
      POSTS_PER_PAGE
    ) {
      break;
    }
  }

  if (
    matched.length === 0 &&
    lastMessage
  ) {
    return {
      posts: [],
      error: true,
      status:
        lastStatus,
      message:
        lastMessage,
    };
  }

  return {
    posts:
      normalizePosts(
        matched,
        streamerId
      ).slice(
        0,
        MAX_POSTS
      ),

    error: false,

    source,
  };
}

/* =========================================
   게시글 변환
========================================= */

function normalizePosts(
  posts: AnyRecord[],
  streamerId: string
) {
  const seen =
    new Set<string>();

  return posts

    .map(
      (
        post,
        index
      ) => {
        const postNo =
          getPostNo(post);

        const title =
          getPostTitle(post);

        const regDate =
          getPostDate(post);

        const id =
          postNo ||
          `${title}-${regDate}-${index}`;

        return {
          id,

          title,

          regDate,

          url:
            postNo
              ? `https://www.sooplive.com/station/${encodeURIComponent(
                  streamerId
                )}/post/${encodeURIComponent(
                  postNo
                )}`
              : BOARD_URL,
        };
      }
    )

    .filter(
      (post) => {
        if (
          seen.has(post.id)
        ) {
          return false;
        }

        seen.add(post.id);

        return true;
      }
    )

    .sort(
      (a, b) => {
        const aTime =
          new Date(
            a.regDate
          ).getTime();

        const bTime =
          new Date(
            b.regDate
          ).getTime();

        if (
          Number.isNaN(aTime) ||
          Number.isNaN(bTime)
        ) {
          return 0;
        }

        return (
          bTime -
          aTime
        );
      }
    );
}

/* =========================================
   API
========================================= */

export async function GET(
  request: Request
) {
  const url =
    new URL(request.url);

  const parts =
    url.pathname
      .split("/")
      .filter(Boolean);

  const streamerId =
    decodeURIComponent(
      parts[
        parts.length - 1
      ] || ""
    );

  const debug =
    url.searchParams.get(
      "debug"
    ) === "1";

  if (!streamerId) {
    return jsonResponse({
      live: false,
      liveError: true,

      posts: [],
      postsError: true,

      message:
        "스트리머 ID가 없습니다.",
    });
  }

  const [
    liveResult,
    postsResult,
  ] =
    await Promise.all([
      getLiveStatus(
        streamerId
      ),

      getBoardPosts(
        streamerId
      ),
    ]);

  const response:
    AnyRecord = {
    id:
      streamerId,

    boardNo:
      BOARD_NO,

    boardUrl:
      BOARD_URL,

    live:
      liveResult.live,

    liveError:
      liveResult.error,

    liveMessage:
      liveResult.message ??
      "",

    posts:
      postsResult.posts,

    postsError:
      postsResult.error,

    postsMessage:
      postsResult.message ??
      "",
  };

  if (debug) {
    response.debug = {
      live:
        liveResult,

      posts: {
        error:
          postsResult.error,

        status:
          postsResult.status ??
          200,

        message:
          postsResult.message ??
          "",

        count:
          postsResult.posts.length,

        source:
          postsResult.source ??
          "",
      },
    };
  }

  return jsonResponse(
    response
  );
}