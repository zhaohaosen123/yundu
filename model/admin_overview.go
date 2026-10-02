package model

import (
	"time"

	"github.com/QuantumNous/new-api/common"
)

const (
	adminOverviewDefaultDays = 14
	adminOverviewMaxDays     = 30
	adminOverviewRecentLimit = 6
)

type AdminOverviewSummary struct {
	TotalUsers          int64   `json:"total_users"`
	EnabledUsers        int64   `json:"enabled_users"`
	NewUsersToday       int64   `json:"new_users_today"`
	ActiveUsersToday    int64   `json:"active_users_today"`
	ActiveUsers30Days   int64   `json:"active_users_30_days"`
	RequestsToday       int64   `json:"requests_today"`
	TokensToday         int64   `json:"tokens_today"`
	QuotaToday          int64   `json:"quota_today"`
	RevenueToday        float64 `json:"revenue_today"`
	Revenue30Days       float64 `json:"revenue_30_days"`
	RevenueTotal        float64 `json:"revenue_total"`
	PayingUsers30Days   int64   `json:"paying_users_30_days"`
	CompletedTopUps     int64   `json:"completed_topups"`
	PendingTopUps       int64   `json:"pending_topups"`
	TotalRequests       int64   `json:"total_requests"`
	TotalUsedQuota      int64   `json:"total_used_quota"`
	TotalRemainingQuota int64   `json:"total_remaining_quota"`
}

type AdminOverviewTrendPoint struct {
	Date          string  `json:"date"`
	Registrations int64   `json:"registrations"`
	Revenue       float64 `json:"revenue"`
	Requests      int64   `json:"requests"`
	Tokens        int64   `json:"tokens"`
	Quota         int64   `json:"quota"`
}

type AdminOverviewUser struct {
	ID          int    `json:"id"`
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
	Group       string `json:"group"`
	Status      int    `json:"status"`
	CreatedAt   int64  `json:"created_at"`
	LastLoginAt int64  `json:"last_login_at"`
}

type AdminOverviewTopUp struct {
	ID            int     `json:"id"`
	UserID        int     `json:"user_id"`
	Username      string  `json:"username"`
	Money         float64 `json:"money"`
	PaymentMethod string  `json:"payment_method"`
	CreateTime    int64   `json:"create_time"`
	CompleteTime  int64   `json:"complete_time"`
	Status        string  `json:"status"`
}

type AdminOverviewData struct {
	GeneratedAt  int64                     `json:"generated_at"`
	PeriodDays   int                       `json:"period_days"`
	Summary      AdminOverviewSummary      `json:"summary"`
	Trend        []AdminOverviewTrendPoint `json:"trend"`
	RecentUsers  []AdminOverviewUser       `json:"recent_users"`
	RecentTopUps []AdminOverviewTopUp      `json:"recent_topups"`
}

type adminOverviewUserAggregate struct {
	CreatedAt   int64
	LastLoginAt int64
}

type adminOverviewTopUpAggregate struct {
	Money        float64
	CompleteTime int64
}

type adminOverviewUsageAggregate struct {
	CreatedAt int64
	Count     int64
	TokenUsed int64
	Quota     int64
}

func normalizeAdminOverviewDays(days int) int {
	if days <= 0 {
		return adminOverviewDefaultDays
	}
	if days > adminOverviewMaxDays {
		return adminOverviewMaxDays
	}
	return days
}

func dayStartUnix(value time.Time) int64 {
	year, month, day := value.Date()
	return time.Date(year, month, day, 0, 0, 0, 0, value.Location()).Unix()
}

func dayKey(timestamp int64, location *time.Location) string {
	return time.Unix(timestamp, 0).In(location).Format("2006-01-02")
}

func GetAdminOverview(days int) (*AdminOverviewData, error) {
	days = normalizeAdminOverviewDays(days)
	now := time.Now()
	todayStart := dayStartUnix(now)
	trendStart := todayStart - int64(days-1)*86400
	thirtyDayStart := todayStart - 29*86400

	data := &AdminOverviewData{
		GeneratedAt: now.Unix(),
		PeriodDays:  days,
		Trend:       make([]AdminOverviewTrendPoint, 0, days),
	}

	for offset := 0; offset < days; offset++ {
		date := time.Unix(trendStart+int64(offset)*86400, 0).In(now.Location())
		data.Trend = append(data.Trend, AdminOverviewTrendPoint{Date: date.Format("2006-01-02")})
	}
	trendIndex := make(map[string]int, len(data.Trend))
	for index, point := range data.Trend {
		trendIndex[point.Date] = index
	}

	userQuery := DB.Unscoped().Model(&User{})
	if err := userQuery.Count(&data.Summary.TotalUsers).Error; err != nil {
		return nil, err
	}
	if err := DB.Model(&User{}).Where("status = ?", common.UserStatusEnabled).Count(&data.Summary.EnabledUsers).Error; err != nil {
		return nil, err
	}
	if err := DB.Unscoped().Model(&User{}).Where("created_at >= ?", todayStart).Count(&data.Summary.NewUsersToday).Error; err != nil {
		return nil, err
	}
	if err := DB.Model(&User{}).Where("last_login_at >= ?", todayStart).Count(&data.Summary.ActiveUsersToday).Error; err != nil {
		return nil, err
	}
	if err := DB.Model(&User{}).Where("last_login_at >= ?", thirtyDayStart).Count(&data.Summary.ActiveUsers30Days).Error; err != nil {
		return nil, err
	}
	if err := DB.Model(&User{}).Select("COALESCE(SUM(request_count), 0)").Scan(&data.Summary.TotalRequests).Error; err != nil {
		return nil, err
	}
	if err := DB.Model(&User{}).Select("COALESCE(SUM(used_quota), 0)").Scan(&data.Summary.TotalUsedQuota).Error; err != nil {
		return nil, err
	}
	if err := DB.Model(&User{}).Select("COALESCE(SUM(quota), 0)").Scan(&data.Summary.TotalRemainingQuota).Error; err != nil {
		return nil, err
	}

	completedTopUps := DB.Model(&TopUp{}).Where("status = ?", common.TopUpStatusSuccess)
	if err := completedTopUps.Count(&data.Summary.CompletedTopUps).Error; err != nil {
		return nil, err
	}
	if err := DB.Model(&TopUp{}).Where("status = ?", common.TopUpStatusPending).Count(&data.Summary.PendingTopUps).Error; err != nil {
		return nil, err
	}
	if err := DB.Model(&TopUp{}).Where("status = ?", common.TopUpStatusSuccess).Select("COALESCE(SUM(money), 0)").Scan(&data.Summary.RevenueTotal).Error; err != nil {
		return nil, err
	}
	if err := DB.Model(&TopUp{}).Where("status = ? AND complete_time >= ?", common.TopUpStatusSuccess, todayStart).Select("COALESCE(SUM(money), 0)").Scan(&data.Summary.RevenueToday).Error; err != nil {
		return nil, err
	}
	if err := DB.Model(&TopUp{}).Where("status = ? AND complete_time >= ?", common.TopUpStatusSuccess, thirtyDayStart).Select("COALESCE(SUM(money), 0)").Scan(&data.Summary.Revenue30Days).Error; err != nil {
		return nil, err
	}
	if err := DB.Model(&TopUp{}).Where("status = ? AND complete_time >= ?", common.TopUpStatusSuccess, thirtyDayStart).Distinct("user_id").Count(&data.Summary.PayingUsers30Days).Error; err != nil {
		return nil, err
	}

	var usageToday adminOverviewUsageAggregate
	if err := DB.Table("quota_data").Where("created_at >= ?", todayStart).Select("COALESCE(SUM(count), 0) AS count, COALESCE(SUM(token_used), 0) AS token_used, COALESCE(SUM(quota), 0) AS quota").Scan(&usageToday).Error; err != nil {
		return nil, err
	}
	data.Summary.RequestsToday = usageToday.Count
	data.Summary.TokensToday = usageToday.TokenUsed
	data.Summary.QuotaToday = usageToday.Quota

	var users []adminOverviewUserAggregate
	if err := DB.Unscoped().Model(&User{}).Select("created_at, last_login_at").Where("created_at >= ?", trendStart).Find(&users).Error; err != nil {
		return nil, err
	}
	for _, user := range users {
		if index, ok := trendIndex[dayKey(user.CreatedAt, now.Location())]; ok {
			data.Trend[index].Registrations++
		}
	}

	var topUps []adminOverviewTopUpAggregate
	if err := DB.Model(&TopUp{}).Select("money, complete_time").Where("status = ? AND complete_time >= ?", common.TopUpStatusSuccess, trendStart).Find(&topUps).Error; err != nil {
		return nil, err
	}
	for _, topUp := range topUps {
		if index, ok := trendIndex[dayKey(topUp.CompleteTime, now.Location())]; ok {
			data.Trend[index].Revenue += topUp.Money
		}
	}

	var usage []adminOverviewUsageAggregate
	if err := DB.Table("quota_data").Select("created_at, COALESCE(SUM(count), 0) AS count, COALESCE(SUM(token_used), 0) AS token_used, COALESCE(SUM(quota), 0) AS quota").Where("created_at >= ?", trendStart).Group("created_at").Find(&usage).Error; err != nil {
		return nil, err
	}
	for _, item := range usage {
		if index, ok := trendIndex[dayKey(item.CreatedAt, now.Location())]; ok {
			data.Trend[index].Requests += item.Count
			data.Trend[index].Tokens += item.TokenUsed
			data.Trend[index].Quota += item.Quota
		}
	}

	if err := DB.Model(&User{}).Order("created_at DESC").Limit(adminOverviewRecentLimit).Find(&data.RecentUsers).Error; err != nil {
		return nil, err
	}
	if err := DB.Table("top_ups").Select("top_ups.id, top_ups.user_id, COALESCE(users.username, '') AS username, top_ups.money, top_ups.payment_method, top_ups.create_time, top_ups.complete_time, top_ups.status").Joins("LEFT JOIN users ON users.id = top_ups.user_id").Order("top_ups.create_time DESC").Limit(adminOverviewRecentLimit).Scan(&data.RecentTopUps).Error; err != nil {
		return nil, err
	}

	return data, nil
}
