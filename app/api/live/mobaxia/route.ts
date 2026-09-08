import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRecord = Record<string, any>;

const MAX_POSTS = 4;
const POSTS_PER_PAGE = 50;
const MAX_PAGES = 10;

/* =========================================
   게시판 설정
========================================= */

// 바샤업up
const UP_BOARD_NO = "124110231";

const UP_BOARD_URL =
  "https://www.sooplive.com/station/mobaxia/board/124110231";

// 일정 안내
const SCHEDULE_BOARD_NO = "124110021";

const SCHEDULE_BOARD_URL =
  "https://www.sooplive.com/station/mobaxia/board/124110021";

// 와키 배포
const WAKI_BOARD_NO = "124449583";

const WAKI_BOARD_URL =
  "https://www.sooplive.com/station/mobaxia/board/124449583";

// 와키는 오래된 기존 글까지 조회
const WAKI_START_DATE =
  "2000-01-01 00:00:00";

// 와키 fallback 검색 페이지 수
const WAKI_MAX_PAGES = 30;

/* =========================================
   공통 JSON 응답
========================================= */

function jsonResponse(data: AnyRecord) {
  return NextResponse.json(data, {
    status: 200,

    headers: {
      "Cache-Control":
        "no-store, no-cache, must-revalidate",
    },
  });
}

/* =========================================
   JSON 안전 변환
========================================= */

function safeJson(
  text: string
): AnyRecord | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/* =========================================
   LIVE 상태 조회
========================================= */

async function getLiveStatus(
  streamerId: string
) {
  const endpoints = [
    "https://live.sooplive.com/afreeca/player_live_api.php",
    "https://live.sooplive.co.kr/afreeca/player_live_api.php",
  ];

  let lastStatus = 0;
  let lastMessage = "";

  for (const endpoint of endpoints) {
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

      const response = await fetch(
        endpoint,
        {
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
        }
      );

      lastStatus = response.status;

      const text =
        await response.text();

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

      const data =
        safeJson(text);

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

        source: endpoint,
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
   게시글 판별
========================================= */

function looksLikePost(
  value: unknown
) {
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

/* =========================================
   응답 내부 게시글 배열 탐색
========================================= */

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
    if (
      value.some(
        looksLikePost
      )
    ) {
      return value.filter(
        looksLikePost
      ) as AnyRecord[];
    }

    for (
      const child
      of value
    ) {
      const found =
        findPostArray(
          child,
          depth + 1
        );

      if (
        found.length > 0
      ) {
        return found;
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
      const found =
        findPostArray(
          child,
          depth + 1
        );

      if (
        found.length > 0
      ) {
        return found;
      }
    }
  }

  return [];
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
   게시글 변환
========================================= */

function normalizePosts(
  posts: AnyRecord[],
  streamerId: string,
  boardUrl: string
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
              : boardUrl,

          originalIndex:
            index,
        };
      }
    )

    /* 중복 제거 */

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

    /* 최신순 정렬 */

    .sort(
      (a, b) => {
        const aTime =
          new Date(
            a.regDate || ""
          ).getTime();

        const bTime =
          new Date(
            b.regDate || ""
          ).getTime();

        const aValid =
          Number.isFinite(
            aTime
          );

        const bValid =
          Number.isFinite(
            bTime
          );

        if (
          aValid &&
          bValid
        ) {
          return (
            bTime -
            aTime
          );
        }

        return (
          a.originalIndex -
          b.originalIndex
        );
      }
    )

    /* 내부용 index 제거 */

    .map(
      ({
        originalIndex,
        ...post
      }) => post
    );
}

/* =========================================
   SOOP 게시판 API
========================================= */

async function getPostsPage(
  streamerId: string,
  page: number,
  boardNumber: string,
  boardUrl: string,
  startDate = ""
) {
  const bases = [
    "https://chapi.sooplive.co.kr/api",
    "https://chapi.sooplive.com/api",
  ];

  let lastStatus = 0;
  let lastMessage = "";

  for (
    const base
    of bases
  ) {
    const url =
      new URL(
        `${base}/${encodeURIComponent(
          streamerId
        )}/board/`
      );

    url.searchParams.set(
      "per_page",
      String(
        POSTS_PER_PAGE
      )
    );

    url.searchParams.set(
      "start_date",
      startDate
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
            method:
              "GET",

            headers: {
              Accept:
                "application/json, text/plain, */*",

              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152.0.0.0 Safari/537.36",

              Referer:
                boardUrl,

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

      if (
        !response.ok
      ) {
        lastMessage =
          `게시글 API HTTP ${response.status}`;

        continue;
      }

      if (
        !text.trim()
      ) {
        return {
          ok: true,

          status:
            response.status,

          posts:
            [] as AnyRecord[],

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

      return {
        ok: true,

        status:
          response.status,

        posts:
          findPostArray(
            data
          ),

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

    posts:
      [] as AnyRecord[],

    message:
      lastMessage ||
      "게시글 API 연결 실패",
  };
}

/* =========================================
   특정 게시판 최신글 조회
========================================= */

async function getBoardPosts(
  streamerId: string,
  boardNo: string,
  boardUrl: string,
  options?: {
    startDate?: string;
    maxPages?: number;
  }
) {
  const startDate =
    options?.startDate ?? "";

  const maxPages =
    options?.maxPages ??
    MAX_PAGES;

  /* =====================================
     1차
     board_number로 게시판 직접 조회
  ===================================== */

  const direct =
    await getPostsPage(
      streamerId,
      1,
      boardNo,
      boardUrl,
      startDate
    );

  if (
    direct.ok &&
    direct.posts.length > 0
  ) {
    /*
      일부 SOOP 응답은 게시판 번호가
      포함될 수도 있고 없을 수도 있음
    */

    const hasBoardNo =
      direct.posts.some(
        (post) =>
          getBoardNo(
            post
          ) !== ""
      );

    const filtered =
      hasBoardNo
        ? direct.posts.filter(
            (post) =>
              getBoardNo(
                post
              ) ===
              boardNo
          )
        : direct.posts;

    if (
      filtered.length > 0
    ) {
      return {
        posts:
          normalizePosts(
            filtered,
            streamerId,
            boardUrl
          ).slice(
            0,
            MAX_POSTS
          ),

        error:
          false,

        status:
          direct.status,

        source:
          direct.source,
      };
    }
  }

  /* =====================================
     2차 fallback
     전체 게시글에서 게시판 번호로 검색
  ===================================== */

  const matched:
    AnyRecord[] = [];

  let lastStatus = 0;
  let lastMessage = "";
  let source = "";

  for (
    let page = 1;
    page <= maxPages;
    page += 1
  ) {
    const result =
      await getPostsPage(
        streamerId,
        page,
        "",
        boardUrl,
        startDate
      );

    lastStatus =
      result.status;

    if (
      !result.ok
    ) {
      lastMessage =
        result.message ||
        "게시글 API 연결 실패";

      break;
    }

    source =
      result.source ||
      source;

    if (
      result.posts.length ===
      0
    ) {
      break;
    }

    const pageMatches =
      result.posts.filter(
        (post) =>
          getBoardNo(
            post
          ) ===
          boardNo
      );

    matched.push(
      ...pageMatches
    );

    /*
      보여줄 글 4개를 확보하면 종료
    */

    if (
      matched.length >=
      MAX_POSTS
    ) {
      break;
    }

    /*
      한 페이지가 50개보다 적다면
      마지막 페이지로 판단
    */

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

      error:
        true,

      status:
        lastStatus,

      message:
        lastMessage,

      source,
    };
  }

  return {
    posts:
      normalizePosts(
        matched,
        streamerId,
        boardUrl
      ).slice(
        0,
        MAX_POSTS
      ),

    error:
      false,

    status:
      lastStatus,

    source,
  };
}

/* =========================================
   API
========================================= */

export async function GET(
  request: Request
) {
  const url =
    new URL(
      request.url
    );

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

  if (
    !streamerId
  ) {
    return jsonResponse({
      live: false,
      liveError: true,

      posts: [],
      postsError: true,

      schedulePosts: [],
      schedulePostsError: true,

      wakiPosts: [],
      wakiPostsError: true,

      message:
        "스트리머 ID가 없습니다.",
    });
  }

  /* =====================================
     LIVE
     바샤업up
     일정 안내
     와키 배포

     동시에 조회
  ===================================== */

  const [
    liveResult,
    upResult,
    scheduleResult,
    wakiResult,
  ] =
    await Promise.all([
      /* LIVE */

      getLiveStatus(
        streamerId
      ),

      /* 바샤업up */

      getBoardPosts(
        streamerId,
        UP_BOARD_NO,
        UP_BOARD_URL
      ),

      /* 일정 안내 */

      getBoardPosts(
        streamerId,
        SCHEDULE_BOARD_NO,
        SCHEDULE_BOARD_URL
      ),

      /* 와키 배포
         오래된 게시글까지 조회 */

      getBoardPosts(
        streamerId,
        WAKI_BOARD_NO,
        WAKI_BOARD_URL,
        {
          startDate:
            WAKI_START_DATE,

          maxPages:
            WAKI_MAX_PAGES,
        }
      ),
    ]);

  const response:
    AnyRecord = {
    id:
      streamerId,

    /* =================================
       LIVE
    ================================= */

    live:
      liveResult.live,

    liveError:
      liveResult.error,

    liveMessage:
      liveResult.message ??
      "",

    /* =================================
       바샤업up
    ================================= */

    boardNo:
      UP_BOARD_NO,

    boardUrl:
      UP_BOARD_URL,

    posts:
      upResult.posts,

    postsError:
      upResult.error,

    postsMessage:
      upResult.message ??
      "",

    /* =================================
       일정 안내
    ================================= */

    scheduleBoardNo:
      SCHEDULE_BOARD_NO,

    scheduleBoardUrl:
      SCHEDULE_BOARD_URL,

    schedulePosts:
      scheduleResult.posts,

    schedulePostsError:
      scheduleResult.error,

    schedulePostsMessage:
      scheduleResult.message ??
      "",

    /* =================================
       와키 배포
    ================================= */

    wakiBoardNo:
      WAKI_BOARD_NO,

    wakiBoardUrl:
      WAKI_BOARD_URL,

    wakiPosts:
      wakiResult.posts,

    wakiPostsError:
      wakiResult.error,

    wakiPostsMessage:
      wakiResult.message ??
      "",
  };

  /* =====================================
     DEBUG
  ===================================== */

  if (
    debug
  ) {
    response.debug = {
      /* LIVE */

      live:
        liveResult,

      /* 바샤업up */

      upBoard: {
        boardNo:
          UP_BOARD_NO,

        error:
          upResult.error,

        status:
          upResult.status ??
          200,

        count:
          upResult.posts.length,

        source:
          upResult.source ??
          "",

        message:
          upResult.message ??
          "",
      },

      /* 일정 안내 */

      scheduleBoard: {
        boardNo:
          SCHEDULE_BOARD_NO,

        error:
          scheduleResult.error,

        status:
          scheduleResult.status ??
          200,

        count:
          scheduleResult.posts.length,

        source:
          scheduleResult.source ??
          "",

        message:
          scheduleResult.message ??
          "",
      },

      /* 와키 배포 */

      wakiBoard: {
        boardNo:
          WAKI_BOARD_NO,

        startDate:
          WAKI_START_DATE,

        maxPages:
          WAKI_MAX_PAGES,

        error:
          wakiResult.error,

        status:
          wakiResult.status ??
          200,

        count:
          wakiResult.posts.length,

        source:
          wakiResult.source ??
          "",

        message:
          wakiResult.message ??
          "",
      },
    };
  }

  return jsonResponse(
    response
  );
}