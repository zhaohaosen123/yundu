package controller

import (
	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-gonic/gin"
)

// GetResourcePoolOverview returns model-level pool health for the admin UI.
// It intentionally omits channel identifiers, names, URLs, and credentials.
func GetResourcePoolOverview(c *gin.Context) {
	channels, err := model.GetAllChannels(0, 0, true, false)
	if err != nil {
		common.SysError("failed to build resource pool overview: " + err.Error())
		common.ApiError(c, err)
		return
	}
	usage, err := service.LoadResourcePoolUsage()
	if err != nil {
		common.SysError("failed to load resource pool usage: " + err.Error())
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, gin.H{"items": service.BuildResourcePoolOverview(channels, usage)})
}
