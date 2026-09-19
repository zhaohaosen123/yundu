package service

import (
	"net/http"
	"strings"

	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/QuantumNous/new-api/setting/system_setting"
)

// GetCallbackAddress resolves the public callback origin for a payment request.
// An explicit custom address remains authoritative; otherwise the URL follows
// the host used by the current client request (including reverse proxies).
func GetCallbackAddress(request *http.Request) string {
	if custom := strings.TrimRight(strings.TrimSpace(operation_setting.CustomCallbackAddress), "/"); custom != "" {
		return custom
	}
	if request != nil && request.Host != "" {
		host := request.Header.Get("X-Forwarded-Host")
		if host == "" {
			host = request.Host
		}
		if comma := strings.IndexByte(host, ','); comma >= 0 {
			host = host[:comma]
		}
		host = strings.TrimSpace(host)
		scheme := request.Header.Get("X-Forwarded-Proto")
		if comma := strings.IndexByte(scheme, ','); comma >= 0 {
			scheme = scheme[:comma]
		}
		scheme = strings.TrimSpace(scheme)
		if scheme == "" {
			scheme = "http"
			if request.TLS != nil {
				scheme = "https"
			}
		}
		return strings.TrimRight(scheme, ":/ ") + "://" + host
	}
	return strings.TrimRight(strings.TrimSpace(system_setting.ServerAddress), "/")
}
