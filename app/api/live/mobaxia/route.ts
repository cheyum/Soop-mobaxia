import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STREAMER_ID = "mobaxia";
const BOARD_NO = "124110231";

const BOARD_URL =
  "https://www.sooplive.com/station/mobaxia/board/124110231";

const POSTS_PER_PAGE = 50;
const MAX_PAGES = 10;
const MAX_POSTS = 4;

type AnyRecord = Record<string, any>;

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
   LIVE 상태 확인

   SOOP 실제 플레이어 API 사용
========================================= */

async function getLiveStatus() {
  const endpoint =
    "https://live.sooplive.com/afreeca/player_live_api.php";

  try {
    const body = new URLSearchParams({
      bid: STREAMER_ID,
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

    const response = await fetch(endpoint, {
      method: "POST",

      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",

        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152.0.0.0 Safari/537.36",

        Referer:
          `https://play.sooplive.com/${STREAMER_ID}`,
      },

      body: body.toString(),

      cache: "no-store",
    });

    const text = await response.text();

    if (!response.ok) {
      return {
        live: false,
        error: true,
        status: response.status,
        message:
          `LIVE API HTTP ${response.status}`,
        raw: text.slice(0, 300),
      };
    }

    if (!text.trim()) {
      return {
        live: false,
        error: true,
        status: response.status,
        message: "LIVE API 응답이 비어 있습니다.",
      };
    }

    let data: AnyRecord;

    try {
      data = JSON.parse(text);
    } catch {
      return {
        live: false,
        error: true,
        status: response.status,
        message:
          "LIVE API 응답을 JSON으로 변환하지 못했습니다.",
        raw: text.slice(0, 300),
      };
    }

    const channel =
      data?.CHANNEL ?? data;

    const result =
      Number(channel?.RESULT ?? 0);

    const broadNo =
      channel?.BNO;

    const live =
      result === 1 &&
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
    };
  } catch (error) {
    return {
      live: false,
      error: true,
      status: 0,
      message:
        error instanceof Error
          ? error.message
          : "LIVE API 연결 실패",
    };
  }
}

/* =========================================
   SOOP 게시판 한 페이지 조회
========================================= */

async function getBoardPage(page: number) {
  const url = new URL(
    `https://chapi.sooplive.co.kr/api/${STREAMER_ID}/board/`
  );

  /*
    최근 SOOP 사이트가 실제 사용하는 형식.

    board_number를 비워두고
    결과의 bbs_no를 직접 비교한다.
  */

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
    ""
  );

  url.searchParams.set(
    "page",
    String(page)
  );

  try {
    const response = await fetch(
      url.toString(),
      {
        method: "GET",

        headers: {
          Accept:
            "application/json, text/plain, */*",

          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152.0.0.0 Safari/537.36",

          Referer:
            `https://www.sooplive.co.kr/station/${STREAMER_ID}`,

          Origin:
            "https://www.sooplive.co.kr",
        },

        cache: "no-store",
      }
    );

    const text =
      await response.text();

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        posts: [] as AnyRecord[],
        raw: text.slice(0, 300),
      };
    }

    if (!text.trim()) {
      return {
        ok: true,
        status: response.status,
        posts: [] as AnyRecord[],
      };
    }

    let data: AnyRecord;

    try {
      data =
        JSON.parse(text);
    } catch {
      return {
        ok: false,
        status: response.status,
        posts: [] as AnyRecord[],
        raw: text.slice(0, 300),
      };
    }

    const posts =
      Array.isArray(data?.data)
        ? data.data
        : [];

    return {
      ok: true,
      status: response.status,
      posts,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      posts: [] as AnyRecord[],
      raw:
        error instanceof Error
          ? error.message
          : "게시글 API 연결 실패",
    };
  }
}

/* =========================================
   바샤업UP 게시판 게시글 조회
========================================= */

async function getBoardPosts() {
  const matched: AnyRecord[] = [];

  let lastStatus = 0;
  let lastError = "";

  for (
    let page = 1;
    page <= MAX_PAGES;
    page += 1
  ) {
    const result =
      await getBoardPage(page);

    lastStatus =
      result.status;

    if (!result.ok) {
      lastError =
        result.raw ||
        `HTTP ${result.status}`;

      break;
    }

    if (
      result.posts.length === 0
    ) {
      break;
    }

    const boardPosts =
      result.posts.filter(
        (post: AnyRecord) => {
          return (
            String(
              post?.bbs_no ??
              post?.bbsNo ??
              ""
            ) === BOARD_NO
          );
        }
      );

    matched.push(
      ...boardPosts
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
    lastError
  ) {
    return {
      posts: [],
      error: true,
      status: lastStatus,
      message:
        `SOOP 게시글 API 연결 실패: ${lastError}`,
    };
  }

  const seen =
    new Set<string>();

  const posts =
    matched

      .map(
        (
          post: AnyRecord,
          index: number
        ) => {
          const titleNo =
            post?.title_no ??
            post?.titleNo ??
            post?.post_no ??
            post?.postNo ??
            "";

          const title =
            String(
              post?.title ??
              post?.subject ??
              "제목 없는 글"
            ).trim();

          const regDate =
            String(
              post?.reg_date ??
              post?.regDate ??
              ""
            );

          const id =
            titleNo
              ? String(titleNo)
              : `${title}-${regDate}-${index}`;

          return {
            id,
            title,
            regDate,

            url:
              titleNo
                ? `https://www.sooplive.com/station/${STREAMER_ID}/post/${encodeURIComponent(
                    String(titleNo)
                  )}`
                : BOARD_URL,
          };
        }
      )

      .filter((post) => {
        if (
          seen.has(post.id)
        ) {
          return false;
        }

        seen.add(post.id);

        return true;
      })

      .sort((a, b) => {
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
      })

      .slice(
        0,
        MAX_POSTS
      );

  return {
    posts,
    error: false,
    status: lastStatus,
  };
}

/* =========================================
   /api/mobaxia
========================================= */

export async function GET(
  request: Request
) {
  const requestUrl =
    new URL(request.url);

  const debug =
    requestUrl.searchParams.get(
      "debug"
    ) === "1";

  const [
    liveResult,
    postsResult,
  ] =
    await Promise.all([
      getLiveStatus(),
      getBoardPosts(),
    ]);

  const response: AnyRecord = {
    id: STREAMER_ID,

    boardNo:
      BOARD_NO,

    boardUrl:
      BOARD_URL,

    live:
      liveResult.live,

    liveError:
      liveResult.error,

    liveMessage:
      liveResult.message ?? "",

    posts:
      postsResult.posts,

    postsError:
      postsResult.error,

    postsMessage:
      postsResult.message ?? "",
  };

  if (debug) {
    response.debug = {
      live: liveResult,
      posts: {
        error:
          postsResult.error,
        status:
          postsResult.status,
        message:
          postsResult.message ?? "",
        count:
          postsResult.posts.length,
      },
    };
  }

  return jsonResponse(
    response
  );
}