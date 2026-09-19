package controller

import (
	"net/http"
	"strings"

	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting/system_setting"
)

func paymentReturnPath(suffix string) string {
	base := strings.TrimRight(system_setting.ServerAddress, "/")
	return base + suffix
}

func paymentReturnPathForRequest(request *http.Request, suffix string) string {
	return strings.TrimRight(service.GetCallbackAddress(request), "/") + suffix
}
