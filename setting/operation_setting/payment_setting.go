package operation_setting

import (
	"sort"

	"github.com/QuantumNous/new-api/setting/config"
)

type PaymentSetting struct {
	AmountOptions  []int           `json:"amount_options"`
	AmountDiscount map[int]float64 `json:"amount_discount"` // 充值金额对应的折扣，例如 100 元 0.9 表示 100 元充值享受 9 折优惠
	// PresetTopups maps the RMB amount paid to the USD credit granted.
	PresetTopups map[int]int `json:"preset_topups"`

	ComplianceConfirmed    bool   `json:"compliance_confirmed"`
	ComplianceTermsVersion string `json:"compliance_terms_version"`
	ComplianceConfirmedAt  int64  `json:"compliance_confirmed_at"`
	ComplianceConfirmedBy  int    `json:"compliance_confirmed_by"`
	ComplianceConfirmedIP  string `json:"compliance_confirmed_ip"`
}

const CurrentComplianceTermsVersion = "v1"

// 默认配置
var paymentSetting = PaymentSetting{
	AmountOptions:  []int{50, 100, 200, 500},
	AmountDiscount: map[int]float64{},
	PresetTopups: map[int]int{
		50:  55,
		100: 120,
		200: 250,
		500: 700,
	},
}

func init() {
	// 注册到全局配置管理器
	config.GlobalConfig.Register("payment_setting", &paymentSetting)
}

func GetPaymentSetting() *PaymentSetting {
	return &paymentSetting
}

func GetPresetTopups() map[int]int {
	presets := make(map[int]int, len(paymentSetting.PresetTopups))
	for paymentAmount, creditedAmount := range paymentSetting.PresetTopups {
		if paymentAmount > 0 && creditedAmount >= paymentAmount {
			presets[paymentAmount] = creditedAmount
		}
	}
	return presets
}

func GetPresetTopupAmounts() []int {
	presets := GetPresetTopups()
	amounts := make([]int, 0, len(presets))
	for paymentAmount := range presets {
		amounts = append(amounts, paymentAmount)
	}
	sort.Ints(amounts)
	return amounts
}

func GetPresetTopupCredit(paymentAmount int64) (int64, bool) {
	amountKey := int(paymentAmount)
	if int64(amountKey) != paymentAmount {
		return 0, false
	}
	creditedAmount, ok := GetPresetTopups()[amountKey]
	return int64(creditedAmount), ok
}

func IsPaymentComplianceConfirmed() bool {
	return paymentSetting.ComplianceConfirmed &&
		paymentSetting.ComplianceTermsVersion == CurrentComplianceTermsVersion
}
