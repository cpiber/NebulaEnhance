export default {
	"manifest_version": 2,
	"name": "__MSG_title__",
	"description": "__MSG_extensionDescription__",
	"version": __VERSION__,
	"icons": {
		"128": "icons/icon_128.png",
		"64": "icons/icon_64.png"
	},
	"background": {
		"scripts": [
			"scripts/background_script.js"
		]
	},
	"content_scripts": [
		{
			"matches": [
				"*://*.player.zype.com/embed/*",
				"*://*.player.zype.com//embed/*",
				"*://*.watchnebula.com/*",
				"*://*.nebula.app/*"
			],
			"js": [
				"scripts/content_script.js"
			],
			"css": [
				"styles/content.css"
			],
			"all_frames": true
		}
	],
	"web_accessible_resources": [
		"scripts/zype.js"
	],
	"permissions": [
		"storage",
		"*://api.zype.com/*"
	],
	"optional_permissions": [
		"*://standard.tv/*",
		"*://*.googleapis.com/*"
	],
	"browser_action": {
		"default_icon": {
			"128": "icons/icon_128.png",
			"64": "icons/icon_64.png"
		},
		"default_title": "__MSG_title__"
	},
	"options_ui": {
		"page": "options/index.html",
		"browser_style": true,
		"chrome_style": true
	},
	"browser_specific_settings": {
	  "gecko": {
			"id": "nebula-enhancer@piber.at"
	  }
	},
	"default_locale": "en"
};