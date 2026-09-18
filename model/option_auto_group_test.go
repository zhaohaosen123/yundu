package model

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestValidateOptionValueRejectsInvalidMaxTokenAutoGroups(t *testing.T) {
	for _, value := range []string{"", "0", "-1", "1.5", "invalid"} {
		t.Run(value, func(t *testing.T) {
			assert.Error(t, validateOptionValue("MaxTokenAutoGroups", value))
		})
	}
	require.NoError(t, validateOptionValue("MaxTokenAutoGroups", "999999"))
}

func TestGetDeploymentOptionOverridesNormalizesAddresses(t *testing.T) {
	t.Setenv("SERVER_ADDRESS", "http://39.96.223.210/")
	t.Setenv("CUSTOM_CALLBACK_ADDRESS", "http://39.96.223.210/")

	overrides := getDeploymentOptionOverrides()

	assert.Equal(t, "http://39.96.223.210", overrides["ServerAddress"])
	assert.Equal(t, "http://39.96.223.210", overrides["CustomCallbackAddress"])
}
