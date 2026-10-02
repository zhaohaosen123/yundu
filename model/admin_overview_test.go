package model

import (
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetAdminOverviewAggregatesGlobalOperationsData(t *testing.T) {
	truncateTables(t)
	now := time.Now().Unix()

	activeUser := User{
		Username:     "overview-active",
		Password:     "password123",
		DisplayName:  "Active User",
		Role:         common.RoleCommonUser,
		Status:       common.UserStatusEnabled,
		Group:        "default",
		AffCode:      "overview-active-aff",
		Quota:        100,
		UsedQuota:    40,
		RequestCount: 10,
		CreatedAt:    now,
		LastLoginAt:  now,
	}
	require.NoError(t, DB.Create(&activeUser).Error)

	deletedUser := User{
		Username:    "overview-deleted",
		Password:    "password123",
		DisplayName: "Deleted User",
		Role:        common.RoleCommonUser,
		Status:      common.UserStatusEnabled,
		Group:       "default",
		AffCode:     "overview-deleted-aff",
		CreatedAt:   now,
		LastLoginAt: now,
	}
	require.NoError(t, DB.Create(&deletedUser).Error)
	require.NoError(t, DB.Delete(&deletedUser).Error)

	require.NoError(t, DB.Create(&TopUp{
		UserId:        activeUser.Id,
		Money:         10,
		TradeNo:       "overview-success",
		PaymentMethod: "alipay",
		CreateTime:    now,
		CompleteTime:  now,
		Status:        common.TopUpStatusSuccess,
	}).Error)
	require.NoError(t, DB.Create(&TopUp{
		UserId:        activeUser.Id,
		Money:         5,
		TradeNo:       "overview-pending",
		PaymentMethod: "wxpay",
		CreateTime:    now,
		Status:        common.TopUpStatusPending,
	}).Error)
	require.NoError(t, DB.Create(&QuotaData{
		UserID:    activeUser.Id,
		Username:  activeUser.Username,
		ModelName: "test-model",
		CreatedAt: now,
		TokenUsed: 120,
		Count:     3,
		Quota:     55,
	}).Error)

	overview, err := GetAdminOverview(14)
	require.NoError(t, err)

	assert.Equal(t, int64(2), overview.Summary.TotalUsers)
	assert.Equal(t, int64(1), overview.Summary.EnabledUsers)
	assert.Equal(t, int64(2), overview.Summary.NewUsersToday)
	assert.Equal(t, int64(1), overview.Summary.ActiveUsersToday)
	assert.Equal(t, int64(3), overview.Summary.RequestsToday)
	assert.Equal(t, int64(120), overview.Summary.TokensToday)
	assert.Equal(t, int64(55), overview.Summary.QuotaToday)
	assert.Equal(t, float64(10), overview.Summary.RevenueToday)
	assert.Equal(t, int64(1), overview.Summary.CompletedTopUps)
	assert.Equal(t, int64(1), overview.Summary.PendingTopUps)
	require.Len(t, overview.Trend, 14)
	assert.Equal(t, int64(2), overview.Trend[13].Registrations)
	assert.Equal(t, float64(10), overview.Trend[13].Revenue)
	assert.Equal(t, int64(3), overview.Trend[13].Requests)
	assert.Equal(t, int64(120), overview.Trend[13].Tokens)
	require.Len(t, overview.TopUsageUsers, 1)
	assert.Equal(t, activeUser.Id, overview.TopUsageUsers[0].UserID)
	assert.Equal(t, int64(120), overview.TopUsageUsers[0].Tokens)
	assert.Equal(t, int64(3), overview.TopUsageUsers[0].Requests)
	require.Len(t, overview.TopPayingUsers, 1)
	assert.Equal(t, activeUser.Id, overview.TopPayingUsers[0].UserID)
	assert.Equal(t, float64(10), overview.TopPayingUsers[0].Amount)
	assert.Equal(t, int64(1), overview.TopPayingUsers[0].Orders)
}
