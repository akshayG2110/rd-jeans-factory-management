import { recentActivities } from "@/lib/dashboard-data"

export function RecentActivities() {
  return (
    <section>
      <h2 className="mb-3 text-base font-bold text-foreground">Recent Activities</h2>
      <div className="flex flex-col gap-2.5">
        {recentActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[18px] bg-card py-6 px-4 text-center ring-1 ring-border/60 shadow-sm">
            <p className="text-xs text-muted-foreground">No recent activities found</p>
          </div>
        ) : (
          recentActivities.map((activity) => (
            <div
              key={activity.title}
              className="flex items-center gap-3 rounded-[18px] bg-card p-3.5 shadow-sm ring-1 ring-border/60"
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${activity.iconBg}`}>
                <activity.icon className={`h-5 w-5 ${activity.iconColor}`} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{activity.title}</p>
                <p className="truncate text-xs text-muted-foreground">{activity.description}</p>
              </div>
              <span className="shrink-0 text-[11px] font-medium text-muted-foreground">{activity.time}</span>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
