"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

type LiveStatus = {
  live: boolean;
  error: boolean;
};

type SoopPost = {
  id: string;
  title: string;
  url: string;
  regDate?: string;
};

type MobaxiaApiResponse = {
  live?: boolean;
  liveError?: boolean;
  liveMessage?: string;

  posts?: SoopPost[];
  postsError?: boolean;
  postsMessage?: string;

  schedulePosts?: SoopPost[];
  schedulePostsError?: boolean;
  schedulePostsMessage?: string;
};

type RouletteRow = {
  날짜?: string | number;
  시간?: string | number;
  후원자?: string;
  후원금액?: string | number;
  "룰렛 결과"?: string;
  메모?: string;
};

/* =========================================
   게시판 링크
========================================= */

const UP_BOARD_URL =
  "https://www.sooplive.com/station/mobaxia/board/124110231";

const SCHEDULE_BOARD_URL =
  "https://www.sooplive.com/station/mobaxia/board/124110021";

/* =========================================
   업보현황 링크
========================================= */

const ROULETTE_URL =
  "https://weflab.com/user/lOPU2suSk2lqZW0";

const ROULETTE_EXCEL_URL =
  "/MOBAXIA_업보현황.xlsx";

export default function Home() {
  /* =========================================
     LIVE
  ========================================= */

  const [status, setStatus] =
    useState<LiveStatus>({
      live: false,
      error: false,
    });

  const [loading, setLoading] =
    useState(true);

  /* =========================================
     바샤업up
  ========================================= */

  const [upPosts, setUpPosts] =
    useState<SoopPost[]>([]);

  const [postsError, setPostsError] =
    useState<string | null>(null);

  /* =========================================
     일정 안내
  ========================================= */

  const [
    schedulePosts,
    setSchedulePosts,
  ] = useState<SoopPost[]>([]);

  const [
    scheduleError,
    setScheduleError,
  ] = useState<string | null>(null);

  const [
    postsLoading,
    setPostsLoading,
  ] = useState(true);

  /* =========================================
     업보현황 Excel
  ========================================= */

  const [
    rouletteRows,
    setRouletteRows,
  ] = useState<RouletteRow[]>([]);

  const [
    rouletteSearch,
    setRouletteSearch,
  ] = useState("");

  const [
    rouletteResults,
    setRouletteResults,
  ] = useState<RouletteRow[]>([]);

  const [
    rouletteSearched,
    setRouletteSearched,
  ] = useState(false);

  const [
    rouletteLoadError,
    setRouletteLoadError,
  ] = useState(false);

  /* =========================================
     SOOP 새로고침
  ========================================= */

  async function refreshMobaxia() {
    try {
      const response =
        await fetch(
          "/api/live/mobaxia",
          {
            cache: "no-store",
          }
        );

      const text =
        await response.text();

      if (
        !response.ok ||
        !text.trim()
      ) {
        setStatus({
          live: false,
          error: true,
        });

        setUpPosts([]);
        setSchedulePosts([]);

        setPostsError(
          "게시글을 불러오지 못했어요"
        );

        setScheduleError(
          "일정을 불러오지 못했어요"
        );

        return;
      }

      const data =
        JSON.parse(
          text
        ) as MobaxiaApiResponse;

      /* LIVE */

      setStatus({
        live:
          Boolean(data.live),

        error:
          Boolean(
            data.liveError
          ),
      });

      /* 바샤업up */

      if (
        Array.isArray(
          data.posts
        )
      ) {
        setUpPosts(
          data.posts.slice(
            0,
            4
          )
        );
      } else {
        setUpPosts([]);
      }

      if (
        data.postsError
      ) {
        setPostsError(
          data.postsMessage ||
            "게시글을 불러오지 못했어요"
        );
      } else {
        setPostsError(null);
      }

      /* 일정 안내 */

      if (
        Array.isArray(
          data.schedulePosts
        )
      ) {
        setSchedulePosts(
          data.schedulePosts.slice(
            0,
            4
          )
        );
      } else {
        setSchedulePosts([]);
      }

      if (
        data.schedulePostsError
      ) {
        setScheduleError(
          data.schedulePostsMessage ||
            "일정을 불러오지 못했어요"
        );
      } else {
        setScheduleError(null);
      }
    } catch (error) {
      console.error(
        "MOBAXIA 정보 조회 실패:",
        error
      );

      setStatus({
        live: false,
        error: true,
      });

      setUpPosts([]);
      setSchedulePosts([]);

      setPostsError(
        "게시글을 불러오지 못했어요"
      );

      setScheduleError(
        "일정을 불러오지 못했어요"
      );
    } finally {
      setLoading(false);
      setPostsLoading(false);
    }
  }

  /* =========================================
     업보현황 Excel 읽기
  ========================================= */

  async function loadRouletteExcel() {
    try {
      /*
        캐시 방지를 위해 현재 시간을 붙임.
        Excel 파일이 교체되었을 때
        최신 파일을 다시 읽기 위함.
      */

      const response =
        await fetch(
          `${ROULETTE_EXCEL_URL}?t=${Date.now()}`,
          {
            cache: "no-store",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Excel 파일을 불러오지 못했습니다."
        );
      }

      const buffer =
        await response.arrayBuffer();

      const workbook =
        XLSX.read(
          buffer,
          {
            type: "array",
          }
        );

      /*
        첫 번째 시트 = 룰렛결과
      */

      const sheetName =
        workbook.SheetNames[0];

      if (!sheetName) {
        throw new Error(
          "Excel 시트가 없습니다."
        );
      }

      const worksheet =
        workbook.Sheets[
          sheetName
        ];

      const rows =
        XLSX.utils.sheet_to_json<RouletteRow>(
          worksheet,
          {
            defval: "",
          }
        );

      /*
        완전히 빈 행 제거
      */

      const validRows =
        rows.filter(
          (row) =>
            Object.values(
              row
            ).some(
              (value) =>
                String(
                  value
                ).trim() !== ""
            )
        );

      setRouletteRows(
        validRows
      );

      setRouletteLoadError(
        false
      );
    } catch (error) {
      console.error(
        "룰렛 Excel 조회 실패:",
        error
      );

      setRouletteRows([]);

      setRouletteLoadError(
        true
      );
    }
  }

  /* =========================================
     Excel 검색
  ========================================= */

  function searchRoulette() {
    const keyword =
      rouletteSearch
        .trim()
        .toLowerCase();

    setRouletteSearched(
      true
    );

    if (!keyword) {
      setRouletteResults(
        []
      );

      return;
    }

    const results =
      rouletteRows.filter(
        (row) => {
          const searchText = [
            row.날짜,
            row.시간,
            row.후원자,
            row.후원금액,
            row["룰렛 결과"],
            row.메모,
          ]
            .map(
              (value) =>
                String(
                  value ?? ""
                )
                  .trim()
                  .toLowerCase()
            )
            .join(" ");

          return searchText.includes(
            keyword
          );
        }
      );

    setRouletteResults(
      results
    );
  }

  /* =========================================
     후원금액 표시
  ========================================= */

  function formatAmount(
    value:
      | string
      | number
      | undefined
  ) {
    if (
      value === undefined ||
      value === null ||
      String(value).trim() === ""
    ) {
      return "";
    }

    const numeric =
      Number(
        String(value).replace(
          /[^\d.-]/g,
          ""
        )
      );

    if (
      Number.isFinite(
        numeric
      )
    ) {
      return `${numeric.toLocaleString(
        "ko-KR"
      )}원`;
    }

    return String(value);
  }

  /* =========================================
     30초 자동 갱신
  ========================================= */

  useEffect(() => {
    refreshMobaxia();
    loadRouletteExcel();

    const timer =
      setInterval(() => {
        refreshMobaxia();

        /*
          Excel 파일도 재확인
        */

        loadRouletteExcel();
      }, 30000);

    return () =>
      clearInterval(
        timer
      );
  }, []);

  return (
    <main className="page">
      {/* 배경 장식 */}

      <div className="bgHeart bgHeart1">
        ♡
      </div>

      <div className="bgHeart bgHeart2">
        ♡
      </div>

      <div className="bgStar bgStar1">
        ✦
      </div>

      <div className="bgStar bgStar2">
        ✦
      </div>

      {/* =================================
          HEADER
      ================================= */}

      <header className="header">
        <div className="brand">
          <div className="brandIcon">
            ♥
          </div>

          <div>
            <h1>
              MOBAXIA
            </h1>

            <p>
              SOOP VIRTUAL STREAMER
            </p>
          </div>
        </div>

        <div className="topStatus">
          {loading ? (
            <>
              <span
                className="statusDot loadingDot"
              />

              방송 상태 확인 중
            </>
          ) : status.error ? (
            <>
              <span
                className="statusDot errorDot"
              />

              상태 확인 중
            </>
          ) : status.live ? (
            <>
              <span
                className="statusDot liveDot"
              />

              바샤좀 놀아줘!
            </>
          ) : (
            <>
              <span
                className="statusDot offlineDot"
              />

              바샤는 쉬는중
            </>
          )}
        </div>
      </header>

      {/* =================================
          메인 프로필 카드
      ================================= */}

      <section className="profileCard">
        {/* 방송화면 */}

        <div className="profileMain">
          <div className="welcomeTag">
            ♡ S급 서민영애 청설모 모씨 모바샤🐿️ ♡
          </div>

          <div
            className={`streamScreen ${
              status.live
                ? "streamOnline"
                : "streamOffline"
            }`}
          >
            {loading ? (
              <div className="streamPlaceholder">
                <span className="loadingStreamDot" />

                <strong>
                  CHECKING
                </strong>

                <p>
                  방송 상태를 확인하고 있어요
                </p>
              </div>
            ) : status.error ? (
              <div className="streamPlaceholder offlineScreen">
                <span className="offlineHeart">
                  ♡
                </span>

                <strong>
                  CHECKING
                </strong>

                <p>
                  방송 상태를 확인하고 있어요
                </p>
              </div>
            ) : status.live ? (
              <iframe
                src="https://play.sooplive.com/mobaxia/embed"
                title="모바샤 SOOP LIVE"
                className="soopPlayer"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="streamPlaceholder offlineScreen">
                <span className="offlineHeart">
                  ♡
                </span>

                <strong>
                  OFFLINE
                </strong>

                <p>
                  지금은 방송을 쉬고 있어요
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽 정보 */}

        <div className="profileDetails">
          <div className="identityRow">
            <div
              className={`smallProfileRing ${
                status.live
                  ? "smallProfileLive"
                  : ""
              }`}
            >
              <ProfileImage />
            </div>

            <div className="identityText">
              <div className="identityName">
                <h2>
                  모바샤
                </h2>

                {status.live &&
                  !loading &&
                  !status.error && (
                    <span className="identityLiveBadge">
                      LIVE
                    </span>
                  )}
              </div>

              <div className="basicInfo">
                생일 · 8월25일

                <span>
                  /
                </span>

                언제나 24살

                <span>
                  /
                </span>

                감성파 ESTJ
              </div>
            </div>
          </div>

          {/* 스케줄 */}

          <div className="scheduleBox">
            <strong>
              🌸 상시 스케줄은 캘린더 참고 🌸
            </strong>

            <p>
              매주 월~금 오후 6시

              <br className="mobileBreak" />

              <span className="pcDivider">
                {" "}·{" "}
              </span>

              토~일 오후 11시

              <br />

              (주1회 휴방) 바샤 등장(˶ᵔ ᵕ ᵔ˶)♥
            </p>

            <div className="scheduleMessage">
              ✦ 오늘도 모바샤와 함께 행복한 하루 ✦
            </div>
          </div>

          {/* 링크 */}

          <div className="linkButtonRow">
            <a
              href="https://www.sooplive.com/station/mobaxia"
              target="_blank"
              rel="noopener noreferrer"
              className="squareLinkButton homeButton"
              aria-label="모바샤 방송국"
              title="모바샤 방송국"
            >
              <svg
                viewBox="0 0 24 24"
                className="linkIcon"
                aria-hidden="true"
              >
                <path
                  d="M3 10.8 12 3l9 7.8v9.7a.5.5 0 0 1-.5.5H15v-6H9v6H3.5a.5.5 0 0 1-.5-.5v-9.7Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>

            <div
              className="squareLinkButton emptyLinkButton"
              title="링크 추가 예정"
            />

            <div
              className="squareLinkButton emptyLinkButton"
              title="링크 추가 예정"
            />

            <div
              className="squareLinkButton emptyLinkButton"
              title="링크 추가 예정"
            />
          </div>
        </div>
      </section>

      {/* =================================
          하단
      ================================= */}

      <section className="contentGrid">
        {/* =================================
            바샤업up
        ================================= */}

        <article className="contentCard">
          <div className="cardTitle">
            <h3>
              바샤업up
            </h3>

            <span>
              BASHA UP
            </span>
          </div>

          <div className="postList">
            {postsLoading ? (
              <div className="postItem">
                최신 글을 불러오는 중이에요 ♡
              </div>
            ) : postsError ? (
              <div
                className="postItem"
                title={postsError}
              >
                게시글을 불러오지 못했어요
              </div>
            ) : upPosts.length > 0 ? (
              upPosts.map(
                (post) => (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="postItem"
                    key={post.id}
                    title={post.title}
                  >
                    {post.title}
                  </a>
                )
              )
            ) : (
              <div className="postItem">
                아직 등록된 글이 없어요 ♡
              </div>
            )}
          </div>

          <button
            type="button"
            className="cardButton"
            onClick={() => {
              window.open(
                UP_BOARD_URL,
                "_blank",
                "noopener,noreferrer"
              );
            }}
          >
            바샤업up 전체보기
          </button>
        </article>

        {/* =================================
            일정 안내
        ================================= */}

        <article className="contentCard">
          <div className="cardTitle">
            <h3>
              일정 안내
            </h3>

            <span>
              Schedule
            </span>
          </div>

          <div className="postList">
            {postsLoading ? (
              <div className="postItem">
                최신 일정을 불러오는 중이에요 ♡
              </div>
            ) : scheduleError ? (
              <div
                className="postItem"
                title={scheduleError}
              >
                일정을 불러오지 못했어요
              </div>
            ) : schedulePosts.length > 0 ? (
              schedulePosts.map(
                (post) => (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="postItem noticeItem"
                    key={post.id}
                    title={post.title}
                  >
                    {post.title}
                  </a>
                )
              )
            ) : (
              <div className="postItem">
                아직 등록된 일정이 없어요 ♡
              </div>
            )}
          </div>

          <button
            type="button"
            className="cardButton"
            onClick={() => {
              window.open(
                SCHEDULE_BOARD_URL,
                "_blank",
                "noopener,noreferrer"
              );
            }}
          >
            일정 전체보기
          </button>
        </article>

        {/* =================================
            업보현황
        ================================= */}

        <article className="contentCard">
          <div className="cardTitle">
            <h3>
              업보현황
            </h3>

            <span>
              Roulette
            </span>
          </div>

          <div className="upboList">
            {/* 1줄 - 룰렛 확률 */}

            <a
              href={ROULETTE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="upboRow upboLink"
            >
              <strong>
                룰렛확률
              </strong>

              <span>
                바로가기 ›
              </span>
            </a>

            {/* 2줄 - Excel */}

            <a
              href={ROULETTE_EXCEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="upboRow upboLink"
            >
              <strong>
                룰렛 결과 엑셀표
              </strong>

              <span>
                열기 ›
              </span>
            </a>

            {/* 3줄 - 검색 */}

            <div className="upboRow upboSearchRow">
              <input
                type="text"
                value={rouletteSearch}
                onChange={(event) => {
                  setRouletteSearch(
                    event.target.value
                  );
                }}
                onKeyDown={(event) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    searchRoulette();
                  }
                }}
                className="upboSearchInput"
                placeholder="후원자 / 룰렛 결과 검색"
                aria-label="업보현황 검색"
              />

              <button
                type="button"
                className="upboSearchButton"
                onClick={
                  searchRoulette
                }
              >
                검색
              </button>
            </div>

            {/* 4줄 - 결과 */}

            <div className="upboRow upboResultRow">
              {rouletteLoadError ? (
                <span className="upboEmpty">
                  엑셀 데이터를 불러오지 못했어요
                </span>
              ) : !rouletteSearched ? (
                <span className="upboEmpty">
                  검색 결과가 여기에 표시됩니다 ♡
                </span>
              ) : !rouletteSearch.trim() ? (
                <span className="upboEmpty">
                  검색어를 입력해주세요 ♡
                </span>
              ) : rouletteResults.length ===
                0 ? (
                <span className="upboEmpty">
                  검색 결과가 없습니다.
                </span>
              ) : (
                <div className="upboResultList">
                  {rouletteResults
                    .slice(
                      0,
                      4
                    )
                    .map(
                      (
                        row,
                        index
                      ) => (
                        <div
                          className="upboResultLine"
                          key={`${String(
                            row.날짜 ?? ""
                          )}-${String(
                            row.시간 ?? ""
                          )}-${String(
                            row.후원자 ?? ""
                          )}-${index}`}
                        >
                          <strong>
                            {row.후원자 ||
                              "후원자 미입력"}
                          </strong>

                          {row.후원금액 !==
                            undefined &&
                            String(
                              row.후원금액
                            ).trim() !==
                              "" && (
                              <span>
                                {" · "}
                                {formatAmount(
                                  row.후원금액
                                )}
                              </span>
                            )}

                          {row[
                            "룰렛 결과"
                          ] && (
                            <span>
                              {" · "}
                              {
                                row[
                                  "룰렛 결과"
                                ]
                              }
                            </span>
                          )}
                        </div>
                      )
                    )}

                  {rouletteResults.length >
                    4 && (
                    <div className="upboMoreResult">
                      외{" "}
                      {rouletteResults.length -
                        4}
                      건의 결과가 더 있습니다.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </article>
      </section>

      {/* FOOTER */}

      <footer className="footer">
        ♡ &nbsp; MOBAXIA FAN PAGE &nbsp; ♡
      </footer>
    </main>
  );
}

/* =========================================
   SOOP 프로필 이미지 자동 연동
========================================= */

function ProfileImage() {
  const streamerId =
    "mobaxia";

  const prefix =
    streamerId
      .slice(0, 2)
      .toLowerCase();

  const sources = [
    `https://stimg.sooplive.com/LOGO/${prefix}/${streamerId}/m/${streamerId}.webp`,

    `https://profile.img.sooplive.com/LOGO/${prefix}/${streamerId}/m/${streamerId}.jpg`,

    `https://stimg.sooplive.com/LOGO/${prefix}/${streamerId}/${streamerId}.jpg`,

    `https://stimg.sooplive.com/LOGO/${prefix}/${streamerId}/${streamerId}.webp`,
  ];

  const [index, setIndex] =
    useState(0);

  const [failed, setFailed] =
    useState(false);

  function handleError() {
    if (
      index + 1 <
      sources.length
    ) {
      setIndex(
        index + 1
      );
    } else {
      setFailed(
        true
      );
    }
  }

  if (failed) {
    return (
      <div className="profileFallback">
        모
      </div>
    );
  }

  return (
    <img
      src={sources[index]}
      alt="모바샤 프로필"
      className="profileImage"
      onError={handleError}
    />
  );
}