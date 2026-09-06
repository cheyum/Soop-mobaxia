import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // 현재 요청 주소에서 스트리머 ID 추출
    // 예: /api/live/mobaxia → mobaxia
    const requestUrl = new URL(request.url);

    const pathParts = requestUrl.pathname
      .split("/")
      .filter(Boolean);

    const streamerId = decodeURIComponent(
      pathParts[pathParts.length - 1] || ""
    );

    // ID가 없는 경우
    if (!streamerId) {
      return NextResponse.json({
        live: false,
        error: true,
        message: "스트리머 ID가 없습니다.",
      });
    }

    const soopUrl =
      `https://api-channel.sooplive.co.kr/v1.1/channel/` +
      `${encodeURIComponent(streamerId)}/home/section/broad`;

    console.log("SOOP 조회 ID:", streamerId);
    console.log("SOOP 조회 주소:", soopUrl);

    const response = await fetch(soopUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        Accept: "application/json",
        Referer:
          `https://www.sooplive.com/station/${streamerId}`,
      },

      cache: "no-store",
    });

    console.log(
      `[${streamerId}] SOOP 응답 상태:`,
      response.status
    );

    // 방송 정보 없음
    if (
      response.status === 204 ||
      response.status === 404
    ) {
      return NextResponse.json({
        id: streamerId,
        live: false,
        error: false,
      });
    }

    const text = await response.text();

    console.log(
      `[${streamerId}] SOOP 응답 내용:`,
      text
    );

    // SOOP 측 HTTP 오류
    if (!response.ok) {
      return NextResponse.json({
        id: streamerId,
        live: false,
        error: true,
        message: `SOOP HTTP 오류 ${response.status}`,
      });
    }

    // 정상 응답인데 내용이 없는 경우
    if (!text.trim()) {
      return NextResponse.json({
        id: streamerId,
        live: false,
        error: false,
      });
    }

    let data;

    try {
      data = JSON.parse(text);
    } catch (error) {
      console.error(
        "SOOP JSON 변환 실패:",
        error
      );

      return NextResponse.json({
        id: streamerId,
        live: false,
        error: true,
        message: "SOOP 응답을 JSON으로 변환하지 못했습니다.",
      });
    }

    // 우선 방송 데이터 존재 여부 확인
    const live =
      data !== null &&
      typeof data === "object" &&
      Object.keys(data).length > 0;

    return NextResponse.json({
      id: streamerId,
      live: live,
      error: false,

      // 현재는 데이터 구조 확인을 위해 넣어둠
      raw: data,
    });

  } catch (error) {
    console.error(
      "SOOP LIVE 조회 오류:",
      error
    );

    return NextResponse.json({
      live: false,
      error: true,
      message:
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.",
    });
  }
}