import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STREAMER_ID = "mobaxia";

type AnyRecord = Record<string, any>;

type Attempt = {
  name: string;
  ok: boolean;
  status?: number;
  detail?: string;
};

function reply(body: AnyRecord, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}

function browserHeaders(referer: string) {
  return {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
    Referer: referer,
  };
}

async function checkPlayerApi(base: string, attempts: Attempt[]) {
  const url = `${base}/afreeca/player_live_api.php`;

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

    const response = await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: {
        ...browserHeaders(`https://play.sooplive.com/${STREAMER_ID}`),
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: body.toString(),
      signal: AbortSignal.timeout(10000),
    });

    const text = await response.text();

    if (!response.ok) {
      attempts.push({
        name: url,
        ok: false,
        status: response.status,
        detail: text.slice(0, 180),
      });
      return null;
    }

    let data: AnyRecord;
    try {
      data = JSON.parse(text);
    } catch {
      attempts.push({
        name: url,
        ok: false,
        status: response.status,
        detail: "JSON 변환 실패",
      });
      return null;
    }

    const channel = data?.CHANNEL;
    if (!channel || typeof channel !== "object") {
      attempts.push({
        name: url,
        ok: false,
        status: response.status,
        detail: "CHANNEL 데이터 없음",
      });
      return null;
    }

    const bno = String(channel?.BNO ?? "").trim();
    const result = Number(channel?.RESULT ?? 0);
    const live = result === 1 && /^\d+$/.test(bno) && Number(bno) > 0;

    attempts.push({
      name: url,
      ok: true,
      status: response.status,
      detail: `RESULT=${String(channel?.RESULT ?? "")}, BNO=${bno || "없음"}`,
    });

    return {
      live,
      broadNo: live ? bno : null,
      source: "player_live_api",
    };
  } catch (error) {
    attempts.push({
      name: url,
      ok: false,
      detail: error instanceof Error ? error.message : "요청 실패",
    });
    return null;
  }
}

async function checkChannelApi(attempts: Attempt[]) {
  const url =
    `https://api-channel.sooplive.co.kr/v1.1/channel/` +
    `${STREAMER_ID}/home/section/broad`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: browserHeaders(
        `https://www.sooplive.com/station/${STREAMER_ID}`
      ),
      signal: AbortSignal.timeout(10000),
    });

    const text = await response.text();

    if (response.status === 204 || response.status === 404) {
      attempts.push({ name: url, ok: true, status: response.status });
      return { live: false, broadNo: null, source: "channel_api" };
    }

    if (!response.ok) {
      attempts.push({
        name: url,
        ok: false,
        status: response.status,
        detail: text.slice(0, 180),
      });
      return null;
    }

    if (!text.trim()) {
      attempts.push({ name: url, ok: true, status: response.status });
      return { live: false, broadNo: null, source: "channel_api" };
    }

    let data: AnyRecord;
    try {
      data = JSON.parse(text);
    } catch {
      attempts.push({
        name: url,
        ok: false,
        status: response.status,
        detail: "JSON 변환 실패",
      });
      return null;
    }

    const live =
      data !== null &&
      typeof data === "object" &&
      !Array.isArray(data) &&
      Object.keys(data).length > 0;

    const broadNo =
      data?.broadNo ??
      data?.broad_no ??
      data?.bno ??
      data?.BNO ??
      null;

    attempts.push({
      name: url,
      ok: true,
      status: response.status,
      detail: live ? "방송 데이터 있음" : "방송 데이터 없음",
    });

    return {
      live,
      broadNo: broadNo ? String(broadNo) : null,
      source: "channel_api",
    };
  } catch (error) {
    attempts.push({
      name: url,
      ok: false,
      detail: error instanceof Error ? error.message : "요청 실패",
    });
    return null;
  }
}

export async function GET(request: Request) {
  const debug = new URL(request.url).searchParams.get("debug") === "1";
  const attempts: Attempt[] = [];

  // 현재 SOOP 웹 플레이어가 사용하는 API를 우선 사용합니다.
  const playerCom = await checkPlayerApi(
    "https://live.sooplive.com",
    attempts
  );

  if (playerCom) {
    return reply({
      id: STREAMER_ID,
      live: playerCom.live,
      broadNo: playerCom.broadNo,
      error: false,
      source: playerCom.source,
      ...(debug ? { debug: attempts } : {}),
    });
  }

  // 이전 도메인도 fallback으로 확인합니다.
  const playerKr = await checkPlayerApi(
    "https://live.sooplive.co.kr",
    attempts
  );

  if (playerKr) {
    return reply({
      id: STREAMER_ID,
      live: playerKr.live,
      broadNo: playerKr.broadNo,
      error: false,
      source: playerKr.source,
      ...(debug ? { debug: attempts } : {}),
    });
  }

  // 마지막 fallback: 채널 홈의 방송 섹션 API
  const channel = await checkChannelApi(attempts);

  if (channel) {
    return reply({
      id: STREAMER_ID,
      live: channel.live,
      broadNo: channel.broadNo,
      error: false,
      source: channel.source,
      ...(debug ? { debug: attempts } : {}),
    });
  }

  return reply({
    id: STREAMER_ID,
    live: false,
    error: true,
    message: "SOOP 방송 상태 API에 연결하지 못했습니다.",
    ...(debug ? { debug: attempts } : {}),
  });
}
