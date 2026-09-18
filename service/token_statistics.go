package service

import (
	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/relaykit/dto"
)

// applyTokenStatisticsMultiplier adjusts the internal billing/statistics copy
// of upstream usage. The response sent to the caller remains unchanged.
func applyTokenStatisticsMultiplier(value int) int {
	if value <= 0 {
		return value
	}
	maxInt := int(^uint(0) >> 1)
	increase := value / 10
	if value%10 != 0 {
		increase++
	}
	if value > maxInt-increase {
		common.SysError("token statistics multiplier saturated at int maximum")
		return maxInt
	}
	return value + increase
}

func addTokenStatisticsValues(values ...int) int {
	maxInt := int(^uint(0) >> 1)
	total := 0
	for _, value := range values {
		if value <= 0 {
			continue
		}
		if value > maxInt-total {
			common.SysError("token statistics sum saturated at int maximum")
			return maxInt
		}
		total += value
	}
	return total
}

func applyUsageTokenStatisticsMultiplier(usage *dto.Usage) {
	if usage == nil {
		return
	}
	usage.PromptTokens = applyTokenStatisticsMultiplier(usage.PromptTokens)
	usage.CompletionTokens = applyTokenStatisticsMultiplier(usage.CompletionTokens)
	usage.InputTokens = applyTokenStatisticsMultiplier(usage.InputTokens)
	usage.OutputTokens = applyTokenStatisticsMultiplier(usage.OutputTokens)
	usage.TotalTokens = max(
		applyTokenStatisticsMultiplier(usage.TotalTokens),
		addTokenStatisticsValues(usage.PromptTokens, usage.CompletionTokens),
		addTokenStatisticsValues(usage.InputTokens, usage.OutputTokens),
	)

	details := &usage.PromptTokensDetails
	details.CachedTokens = applyTokenStatisticsMultiplier(details.CachedTokens)
	details.CachedCreationTokens = applyTokenStatisticsMultiplier(details.CachedCreationTokens)
	details.CacheWriteTokens = applyTokenStatisticsMultiplier(details.CacheWriteTokens)
	details.TextTokens = applyTokenStatisticsMultiplier(details.TextTokens)
	details.AudioTokens = applyTokenStatisticsMultiplier(details.AudioTokens)
	details.ImageTokens = applyTokenStatisticsMultiplier(details.ImageTokens)
	if cached := details.CachedTokensDetails; cached != nil {
		if cached.TextTokens != nil {
			value := applyTokenStatisticsMultiplier(*cached.TextTokens)
			cached.TextTokens = &value
		}
		if cached.ImageTokens != nil {
			value := applyTokenStatisticsMultiplier(*cached.ImageTokens)
			cached.ImageTokens = &value
		}
		if cached.AudioTokens != nil {
			value := applyTokenStatisticsMultiplier(*cached.AudioTokens)
			cached.AudioTokens = &value
		}
	}

	usage.CompletionTokenDetails.TextTokens = applyTokenStatisticsMultiplier(usage.CompletionTokenDetails.TextTokens)
	usage.CompletionTokenDetails.AudioTokens = applyTokenStatisticsMultiplier(usage.CompletionTokenDetails.AudioTokens)
	usage.CompletionTokenDetails.ImageTokens = applyTokenStatisticsMultiplier(usage.CompletionTokenDetails.ImageTokens)
	usage.CompletionTokenDetails.ReasoningTokens = applyTokenStatisticsMultiplier(usage.CompletionTokenDetails.ReasoningTokens)
}

func usageForInternalStatistics(usage *dto.Usage) *dto.Usage {
	if usage == nil {
		return nil
	}
	copy := *usage
	copy.PromptTokensDetails = usage.PromptTokensDetails.Clone()
	copy.CompletionTokenDetails = usage.CompletionTokenDetails
	if usage.InputTokensDetails != nil {
		inputDetails := usage.InputTokensDetails.Clone()
		copy.InputTokensDetails = &inputDetails
	}
	if usage.OutputTokensDetails != nil {
		outputDetails := *usage.OutputTokensDetails
		copy.OutputTokensDetails = &outputDetails
	}
	return &copy
}

func applyRealtimeTokenStatisticsMultiplier(usage *dto.RealtimeUsage) {
	if usage == nil {
		return
	}
	usage.InputTokens = applyTokenStatisticsMultiplier(usage.InputTokens)
	usage.OutputTokens = applyTokenStatisticsMultiplier(usage.OutputTokens)
	usage.TotalTokens = max(
		applyTokenStatisticsMultiplier(usage.TotalTokens),
		addTokenStatisticsValues(usage.InputTokens, usage.OutputTokens),
	)
	usage.InputTokenDetails.TextTokens = applyTokenStatisticsMultiplier(usage.InputTokenDetails.TextTokens)
	usage.InputTokenDetails.AudioTokens = applyTokenStatisticsMultiplier(usage.InputTokenDetails.AudioTokens)
	usage.OutputTokenDetails.TextTokens = applyTokenStatisticsMultiplier(usage.OutputTokenDetails.TextTokens)
	usage.OutputTokenDetails.AudioTokens = applyTokenStatisticsMultiplier(usage.OutputTokenDetails.AudioTokens)
}

func realtimeUsageForInternalStatistics(usage *dto.RealtimeUsage) *dto.RealtimeUsage {
	if usage == nil {
		return nil
	}
	copy := *usage
	copy.InputTokenDetails = usage.InputTokenDetails.Clone()
	copy.OutputTokenDetails = usage.OutputTokenDetails
	return &copy
}
