package service

import (
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
)

// ResourcePoolSummary is an internal-facing view of a model's available
// channel pool. It deliberately contains no provider URL, key, or channel
// name so it can be safely extended for administrative dashboards.
type ResourcePoolSummary struct {
	Model              string  `json:"model"`
	TotalResources     int     `json:"total_resources"`
	HealthyResources   int     `json:"healthy_resources"`
	DisabledResources  int     `json:"disabled_resources"`
	MaxPriority        int64   `json:"max_priority"`
	TotalWeight        uint    `json:"total_weight"`
	AverageLatencyMs   int     `json:"average_latency_ms"`
	Ready              bool    `json:"ready"`
	RequestCount       int64   `json:"request_count"`
	TokenUsed          int64   `json:"token_used"`
	QuotaUsed          int64   `json:"quota_used"`
	ErrorCount         int64   `json:"error_count"`
	ErrorRate          float64 `json:"error_rate"`
	Balance            float64 `json:"balance"`
	BalanceUpdatedTime int64   `json:"balance_updated_time"`
	Requests5m         int64   `json:"requests_5m"`
	Tokens5m           int64   `json:"tokens_5m"`
	Requests1h         int64   `json:"requests_1h"`
	Tokens1h           int64   `json:"tokens_1h"`
}

type resourcePoolUsage struct {
	ChannelID  int
	Requests   int64
	Tokens     int64
	Quota      int64
	Errors     int64
	Latency    int64
	Requests5m int64
	Tokens5m   int64
	Requests1h int64
	Tokens1h   int64
}

func LoadResourcePoolUsage() (map[int]resourcePoolUsage, error) {
	rows := make([]struct {
		ChannelID  int
		Requests   int64
		Tokens     int64
		Quota      int64
		Errors     int64
		Latency    int64
		Requests5m int64 `gorm:"column:requests_5m"`
		Tokens5m   int64 `gorm:"column:tokens_5m"`
		Requests1h int64 `gorm:"column:requests_1h"`
		Tokens1h   int64 `gorm:"column:tokens_1h"`
	}, 0)
	now := time.Now().Unix()
	err := model.LOG_DB.Model(&model.Log{}).
		Select("channel_id, COALESCE(SUM(CASE WHEN type = ? THEN 1 ELSE 0 END), 0) AS requests, COALESCE(SUM(CASE WHEN type = ? THEN prompt_tokens + completion_tokens ELSE 0 END), 0) AS tokens, COALESCE(SUM(CASE WHEN type = ? THEN quota ELSE 0 END), 0) AS quota, COALESCE(SUM(CASE WHEN type = ? THEN 1 ELSE 0 END), 0) AS errors, COALESCE(SUM(CASE WHEN type = ? THEN use_time ELSE 0 END), 0) AS latency, COALESCE(SUM(CASE WHEN type = ? AND created_at >= ? THEN 1 ELSE 0 END), 0) AS requests_5m, COALESCE(SUM(CASE WHEN type = ? AND created_at >= ? THEN prompt_tokens + completion_tokens ELSE 0 END), 0) AS tokens_5m, COALESCE(SUM(CASE WHEN type = ? AND created_at >= ? THEN 1 ELSE 0 END), 0) AS requests_1h, COALESCE(SUM(CASE WHEN type = ? AND created_at >= ? THEN prompt_tokens + completion_tokens ELSE 0 END), 0) AS tokens_1h", model.LogTypeConsume, model.LogTypeConsume, model.LogTypeConsume, model.LogTypeError, model.LogTypeConsume, model.LogTypeConsume, now-300, model.LogTypeConsume, now-300, model.LogTypeConsume, now-3600, model.LogTypeConsume, now-3600).
		Where("channel_id > 0").Group("channel_id").Scan(&rows).Error
	if err != nil {
		return nil, fmt.Errorf("load resource pool usage: %w", err)
	}
	usage := make(map[int]resourcePoolUsage, len(rows))
	for _, row := range rows {
		usage[row.ChannelID] = resourcePoolUsage{ChannelID: row.ChannelID, Requests: row.Requests, Tokens: row.Tokens, Quota: row.Quota, Errors: row.Errors, Latency: row.Latency, Requests5m: row.Requests5m, Tokens5m: row.Tokens5m, Requests1h: row.Requests1h, Tokens1h: row.Tokens1h}
	}
	return usage, nil
}

// BuildResourcePoolOverview aggregates a channel snapshot by exposed model.
// Model strings are trimmed and de-duplicated per channel because channel
// configuration commonly contains comma-separated model lists.
func BuildResourcePoolOverview(channels []*model.Channel, usageByChannel map[int]resourcePoolUsage) []ResourcePoolSummary {
	type accumulator struct {
		model              string
		total              int
		healthy            int
		disabled           int
		maxPriority        int64
		weight             uint
		latencyTotal       int
		latencyCount       int
		requests           int64
		tokens             int64
		quota              int64
		errors             int64
		balance            float64
		balanceUpdatedTime int64
		requests5m         int64
		tokens5m           int64
		requests1h         int64
		tokens1h           int64
	}
	byModel := make(map[string]*accumulator)
	for _, channel := range channels {
		if channel == nil {
			continue
		}
		priority := int64(0)
		if channel.Priority != nil {
			priority = *channel.Priority
		}
		weight := uint(0)
		if channel.Weight != nil {
			weight = *channel.Weight
		}
		seen := make(map[string]struct{})
		for _, rawModel := range strings.Split(channel.Models, ",") {
			modelName := strings.TrimSpace(rawModel)
			if modelName == "" {
				continue
			}
			if _, exists := seen[modelName]; exists {
				continue
			}
			seen[modelName] = struct{}{}
			entry := byModel[modelName]
			if entry == nil {
				entry = &accumulator{model: modelName, maxPriority: priority}
				byModel[modelName] = entry
			}
			entry.total++
			if channel.Status == common.ChannelStatusEnabled {
				entry.healthy++
			} else {
				entry.disabled++
			}
			if priority > entry.maxPriority {
				entry.maxPriority = priority
			}
			entry.weight += weight
			entry.balance += channel.Balance
			if channel.BalanceUpdatedTime > entry.balanceUpdatedTime {
				entry.balanceUpdatedTime = channel.BalanceUpdatedTime
			}
			if usage, ok := usageByChannel[channel.Id]; ok {
				entry.requests += usage.Requests
				entry.tokens += usage.Tokens
				entry.quota += usage.Quota
				entry.errors += usage.Errors
				entry.requests5m += usage.Requests5m
				entry.tokens5m += usage.Tokens5m
				entry.requests1h += usage.Requests1h
				entry.tokens1h += usage.Tokens1h
			}
			if channel.ResponseTime > 0 {
				entry.latencyTotal += channel.ResponseTime
				entry.latencyCount++
			}
		}
	}

	result := make([]ResourcePoolSummary, 0, len(byModel))
	for _, entry := range byModel {
		averageLatency := 0
		if entry.latencyCount > 0 {
			averageLatency = entry.latencyTotal / entry.latencyCount
		}
		errorRate := float64(0)
		if entry.requests+entry.errors > 0 {
			errorRate = float64(entry.errors) / float64(entry.requests+entry.errors)
		}
		result = append(result, ResourcePoolSummary{
			Model:              entry.model,
			TotalResources:     entry.total,
			HealthyResources:   entry.healthy,
			DisabledResources:  entry.disabled,
			MaxPriority:        entry.maxPriority,
			TotalWeight:        entry.weight,
			AverageLatencyMs:   averageLatency,
			Ready:              entry.healthy > 0,
			RequestCount:       entry.requests,
			TokenUsed:          entry.tokens,
			QuotaUsed:          entry.quota,
			ErrorCount:         entry.errors,
			ErrorRate:          errorRate,
			Balance:            entry.balance,
			BalanceUpdatedTime: entry.balanceUpdatedTime,
			Requests5m:         entry.requests5m, Tokens5m: entry.tokens5m,
			Requests1h: entry.requests1h, Tokens1h: entry.tokens1h,
		})
	}
	sort.Slice(result, func(i, j int) bool { return result[i].Model < result[j].Model })
	return result
}
