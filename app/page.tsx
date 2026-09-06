"use client";

import { useEffect, useMemo, useState } from "react";

type Streamer = {
  name: string;
  id: string;
  category: string;
};

type LiveStatus = {
  live: boolean;
  error?: boolean;
};

const streamers: Streamer[] = [
  {
    name: "모바샤",
    id: "mobaxia",
    category: "버츄얼",
  },

  // 스트리머를 추가할 때는 아래처럼 추가하세요.
  /*
  {
    name: "스트리머2",
    id: "soop아이디",
    category: "음악",
  },

  {
    name: "스트리머3",
    id: "soop아이디",
    category: "게임",
  },
  */
];

const filters = ["전체", "LIVE", "버츄얼", "음악", "게임"];

export default function Home() {
  const [status, setStatus] = useState<Record<string, LiveStatus>>({});
  const [selectedFilter, setSelectedFilter] = useState("전체");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function checkLive() {
  const result: Record<string, LiveStatus> = {};

  await Promise.all(
    streamers.map(async (streamer) => {
      try {
        const response = await fetch(
          `/api/live/${encodeURIComponent(streamer.id)}`,
          {
            cache: "no-store",
          }
        );

        // JSON으로 바로 변환하지 않고 먼저 글자로 받음
        const text = await response.text();

        // API 자체가 오류를 반환한 경우
        if (!response.ok) {
          console.error(
            `${streamer.name} API 오류:`,
            response.status,
            text
          );

          result[streamer.id] = {
            live: false,
            error: true,
          };

          return;
        }

        // 응답 내용이 비어있는 경우
        if (!text.trim()) {
          console.error(
            `${streamer.name} API 응답이 비어있습니다.`
          );

          result[streamer.id] = {
            live: false,
            error: true,
          };

          return;
        }

        let data: LiveStatus;

        // JSON 변환 시도
        try {
          data = JSON.parse(text) as LiveStatus;
        } catch (error) {
          console.error(
            `${streamer.name} JSON 변환 실패:`,
            text
          );

          result[streamer.id] = {
            live: false,
            error: true,
          };

          return;
        }

        result[streamer.id] = {
          live: Boolean(data.live),
          error: Boolean(data.error),
        };
      } catch (error) {
        console.error(
          `${streamer.name} 방송 상태 확인 실패:`,
          error
        );

        result[streamer.id] = {
          live: false,
          error: true,
        };
      }
    })
  );

  setStatus(result);
  setLoading(false);
}

  useEffect(() => {
    checkLive();

    // 60초마다 방송 상태 다시 확인
    const timer = setInterval(() => {
      checkLive();
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const filteredStreamers = useMemo(() => {
    return streamers.filter((streamer) => {
      const keyword = search.trim().toLowerCase();

      const matchesSearch =
        streamer.name.toLowerCase().includes(keyword) ||
        streamer.id.toLowerCase().includes(keyword);

      if (!matchesSearch) {
        return false;
      }

      if (selectedFilter === "전체") {
        return true;
      }

      if (selectedFilter === "LIVE") {
        return status[streamer.id]?.live === true;
      }

      return streamer.category === selectedFilter;
    });
  }, [search, selectedFilter, status]);

  const liveStreamers = filteredStreamers.filter(
    (streamer) => status[streamer.id]?.live === true
  );

  const offlineStreamers = filteredStreamers.filter(
    (streamer) => status[streamer.id]?.live !== true
  );

  const totalLive = streamers.filter(
    (streamer) => status[streamer.id]?.live === true
  ).length;

  return (
    <main className="page">

      {/* 상단 */}
      <header className="header">

        <div className="logoArea">
          <div className="logoIcon">S</div>

          <div>
            <h1>SOOP VIRTUAL</h1>
            <p>SOOP 스트리머 방송 현황</p>
          </div>
        </div>

        <div className="liveCount">
          <span className="liveDot" />

          {loading ? (
            <span>방송 상태 확인 중...</span>
          ) : (
            <span>
              현재 <strong>{totalLive}명</strong>의 스트리머가
              방송 중입니다
            </span>
          )}
        </div>

      </header>

      {/* 필터 + 검색 */}
      <section className="controls">

        <div className="filters">

          {filters.map((filter) => (
            <button
              key={filter}
              className={
                selectedFilter === filter
                  ? "filterButton active"
                  : "filterButton"
              }
              onClick={() => setSelectedFilter(filter)}
            >
              {filter === "LIVE" ? "● LIVE" : filter}
            </button>
          ))}

        </div>

        <div className="searchBox">
          <span>🔎</span>

          <input
            type="text"
            placeholder="스트리머 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

      </section>

      {/* LIVE */}
      <section className="streamSection">

        <div className="sectionTitle">
          <div>
            <span className="sectionLiveDot" />
            <h2>LIVE</h2>
          </div>

          <span>{liveStreamers.length}</span>
        </div>

        {loading ? (
          <div className="emptyMessage">
            방송 상태를 확인하고 있습니다...
          </div>
        ) : liveStreamers.length > 0 ? (
          <div className="streamGrid">

            {liveStreamers.map((streamer) => (
              <StreamerCard
                key={streamer.id}
                streamer={streamer}
                live={true}
                error={status[streamer.id]?.error}
              />
            ))}

          </div>
        ) : (
          <div className="emptyMessage">
            현재 조건에 맞는 LIVE 스트리머가 없습니다.
          </div>
        )}

      </section>

      {/* OFFLINE */}
      {selectedFilter !== "LIVE" && !loading && (
        <section className="streamSection offlineSection">

          <div className="sectionTitle offlineTitle">

            <div>
              <span className="offlineDot" />
              <h2>OFFLINE</h2>
            </div>

            <span>{offlineStreamers.length}</span>

          </div>

          {offlineStreamers.length > 0 ? (
            <div className="streamGrid">

              {offlineStreamers.map((streamer) => (
                <StreamerCard
                  key={streamer.id}
                  streamer={streamer}
                  live={false}
                  error={status[streamer.id]?.error}
                />
              ))}

            </div>
          ) : (
            <div className="emptyMessage">
              조건에 맞는 스트리머가 없습니다.
            </div>
          )}

        </section>
      )}

    </main>
  );
}


/* ================================
   스트리머 카드
================================ */

function StreamerCard({
  streamer,
  live,
  error,
}: {
  streamer: Streamer;
  live: boolean;
  error?: boolean;
}) {
  return (
    <article
      className={`streamCard ${live ? "liveCard" : ""}`}
    >
      {/* 카드 상단 */}
      <div className="thumbnail">

  {/* 방송 중일 때 */}
  {live && (
    <div className="badge liveBadge">
      ● LIVE
    </div>
  )}

  {/* 오프라인일 때 작은 배지만 표시 */}
  {!live && !error && (
    <div className="badge offlineBadge">
      OFFLINE
    </div>
  )}

  {/* 상태 확인 실패 */}
  {!live && error && (
    <div className="badge errorBadge">
      확인 실패
    </div>
  )}

</div>

      {/* 카드 정보 */}
      <div className="cardContent">

        <div className="streamerInfo">

          {/* 프로필 사진 */}
          <ProfileImage
            streamerId={streamer.id}
            streamerName={streamer.name}
            live={live}
          />

          {/* 닉네임 + 카테고리 */}
          <div className="streamerText">
            <h3>{streamer.name}</h3>

            <span className="category">
              {streamer.category}
            </span>
          </div>

          {/* 방송 중일 때만 */}
          {live && (
            <span className="onAir">
              ON AIR
            </span>
          )}

        </div>

        {error && (
          <div className="statusError">
            방송 상태를 확인하지 못했습니다.
          </div>
        )}

        <a
          href={`https://www.sooplive.com/station/${streamer.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="stationButton"
        >
          방송국 바로가기
          <span>→</span>
        </a>

      </div>
    </article>
  );
}


/* ================================
   SOOP 프로필 사진
================================ */

function ProfileImage({
  streamerId,
  streamerName,
  live,
}: {
  streamerId: string;
  streamerName: string;
  live: boolean;
}) {
  const prefix = streamerId.slice(0, 2).toLowerCase();

  /*
    순서대로 이미지 로딩 시도

    1. SOOP webp 중간 사이즈
    2. SOOP jpg 중간 사이즈
    3. SOOP 원본 jpg
    4. SOOP 원본 webp
  */

  const imageSources = [
    `https://stimg.sooplive.com/LOGO/${prefix}/${streamerId}/m/${streamerId}.webp`,

    `https://profile.img.sooplive.com/LOGO/${prefix}/${streamerId}/m/${streamerId}.jpg`,

    `https://stimg.sooplive.com/LOGO/${prefix}/${streamerId}/${streamerId}.jpg`,

    `https://stimg.sooplive.com/LOGO/${prefix}/${streamerId}/${streamerId}.webp`,
  ];

  const [imageIndex, setImageIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);

  function handleImageError() {
    const nextIndex = imageIndex + 1;

    // 다음 이미지 주소가 있으면 재시도
    if (nextIndex < imageSources.length) {
      setImageIndex(nextIndex);
      return;
    }

    // 모든 주소 실패
    setImageFailed(true);
  }

  if (imageFailed) {
    return (
      <div
        className={`profileFallback ${
          live ? "profileLive" : ""
        }`}
        title="프로필 이미지를 불러오지 못했습니다."
      >
        {streamerName.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={imageSources[imageIndex]}
      alt={`${streamerName} 프로필`}
      className={`profileImage ${
        live ? "profileLive" : ""
      }`}
      loading="lazy"
      onError={handleImageError}
    />
  );
}