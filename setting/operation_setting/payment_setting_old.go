/**
此文件为旧版支付设置文件，如需增加新的参数、变量等，请在 payment_setting.go 中添加
This file is the old version of the payment settings file. If you need to add new parameters, variables, etc., please add them in payment_setting.go
*/

package operation_setting

import (
	"github.com/QuantumNous/new-api/common"
)

var supportedPayMethods = map[string]struct{}{
	"alipay": {},
	"wxpay":  {},
}

var PayAddress = ""
var CustomCallbackAddress = ""
var EpayId = ""
var EpayKey = ""

// RMB payment amount is used directly; no USD-to-RMB conversion is applied.
var Price = 1.0
var MinTopUp = 1

// Kept for persisted option compatibility. RMB is the sole billing currency,
// so no exchange conversion is applied.
var USDExchangeRate = 1.0

var PayMethods = []map[string]string{
	{
		"name": "支付宝",
		"icon": "SiAlipay",
		"type": "alipay",
	},
	{
		"name": "微信",
		"icon": "SiWechat",
		"type": "wxpay",
	},
}

func UpdatePayMethodsByJsonString(jsonString string) error {
	var methods []map[string]string
	if err := common.Unmarshal([]byte(jsonString), &methods); err != nil {
		return err
	}

	PayMethods = make([]map[string]string, 0, len(methods))
	for _, method := range methods {
		if _, ok := supportedPayMethods[method["type"]]; ok {
			PayMethods = append(PayMethods, method)
		}
	}
	return nil
}

func PayMethods2JsonString() string {
	jsonBytes, err := common.Marshal(PayMethods)
	if err != nil {
		return "[]"
	}
	return string(jsonBytes)
}

func GetSupportedPayMethods() []map[string]string {
	methods := make([]map[string]string, 0, len(PayMethods))
	for _, method := range PayMethods {
		if _, ok := supportedPayMethods[method["type"]]; ok {
			methods = append(methods, method)
		}
	}
	return methods
}

func ContainsPayMethod(method string) bool {
	if _, ok := supportedPayMethods[method]; !ok {
		return false
	}
	for _, payMethod := range PayMethods {
		if payMethod["type"] == method {
			return true
		}
	}
	return false
}
