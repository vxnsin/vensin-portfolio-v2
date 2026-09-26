import { requireAdmin } from "@/lib/auth";
import { currentSeason, getSeasonSetting } from "@/lib/season";
import { ALL_SEASONS, SEASON_ICON, SEASON_LABEL, SEASON_WHEN, SEASONS, seasonFor, seasonGreeting, seasonNote } from "@/lib/season-data";
import { pinSeasonAction } from "../actions";
import { SeasonShowcase } from "./SeasonShowcase";

export const dynamic = "force-dynamic";

export default async function AdminSeasons() {
  await requireAdmin();
  const pinned = getSeasonSetting();
  const current = currentSeason();
  const calendar = seasonFor();
  const seasons = ALL_SEASONS.map((id) => ({
    id,
    icon: SEASON_ICON[id],
    label: SEASON_LABEL[id].split(" · ")[0],
    when: SEASON_WHEN[id],
    kind: (SEASONS as readonly string[]).includes(id) ? ("season" as const) : ("special" as const),
    greeting: seasonGreeting(id),
    note: seasonNote(id),
  }));

  return (
    <div className="grid gap-3">
      <h2 className="pixel text-accent">seasons &amp; special days</h2>
      <p className="text-xs text-ink-soft">
        every look the site can wear. the calendar says <b>{calendar}</b>
        {pinned !== "auto" ? (
          <>
            , but <b>{pinned}</b> is pinned as the default for everyone
          </>
        ) : (
          ", and nothing is pinned"
        )}
        , so visitors without their own pick see <b>{current}</b>. previews use <code>?season=</code>, which only works while you are logged in and never changes what visitors see.
      </p>
      <SeasonShowcase seasons={seasons} current={current} pinned={pinned} pinAction={pinSeasonAction} />
    </div>
  );
}
