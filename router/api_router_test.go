package router

import (
	"net/http"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAdminOverviewUsesDedicatedRoute(t *testing.T) {
	gin.SetMode(gin.TestMode)
	engine := gin.New()
	SetApiRouter(engine)

	for _, route := range engine.Routes() {
		if route.Method == http.MethodGet && route.Path == "/api/admin/overview" {
			assert.True(t, strings.HasSuffix(route.Handler, ".GetAdminOverview"))
			return
		}
	}

	require.Fail(t, "administrator overview route is not registered")
}
