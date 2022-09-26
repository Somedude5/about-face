/**
 * About Face -- A Token Rotator
 * Rotates tokens based on the direction the token is moved
 *
 * by Eadorin, edzillion
 */

import { AboutFace, drawAboutFaceIndicator, onPreCreateToken, onPreUpdateToken } from "./scripts/logic.js";
import { asyncRenderSceneConfigHandler, MODULE_ID, registerSettings, renderSceneConfigHandler, renderSettingsConfigHandler, renderTokenConfigHandler } from "./scripts/settings.js";

Hooks.once("init", () => {
	registerSettings();
	game.aboutFace = new AboutFace();
	libWrapper.register(MODULE_ID, "Token.prototype.refresh", drawAboutFaceIndicator, "WRAPPER");

	game.keybindings.register(MODULE_ID, "toggleTokenRotation", {
		name: "about-face.keybindings.toggleTokenRotation.name",
		hint: "about-face.keybindings.toggleTokenRotation.hint",
		onDown: () => {
			game.aboutFace.toggleTokenRotation = !game.aboutFace.toggleTokenRotation;
			ui.notifications.info("About Face: " + game.i18n.localize(`about-face.keybindings.toggleTokenRotation.tooltip.${game.aboutFace.toggleTokenRotation}`), {
				console: false,
			});
		},
		restricted: false,
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	});
	game.keybindings.register(MODULE_ID, "lockRotation", {
		name: "about-face.keybindings.lockRotation.name",
		hint: "about-face.keybindings.lockRotation.hint",
		onDown: () => {
			for (let token of canvas.tokens.controlled) {
				var lockRotation = !token.document.lockRotation;
				token.document.update({ lockRotation: lockRotation });
			}
			ui.notifications.info("About Face: " + game.i18n.localize(`about-face.keybindings.lockRotation.tooltip.${lockRotation}`), { console: false });
		},
		restricted: true,
		precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
	});
});
Hooks.on("canvasReady", () => {
	if (canvas.scene?.flags?.[MODULE_ID] == undefined) {
		canvas.scene.setFlag(MODULE_ID, "sceneEnabled", true);
	}
});
Hooks.on("preCreateToken", onPreCreateToken);
Hooks.on("preUpdateToken", onPreUpdateToken);
Hooks.on("renderSceneConfig", renderSceneConfigHandler);
Hooks.on("renderSceneConfig", asyncRenderSceneConfigHandler);
Hooks.on("renderTokenConfig", renderTokenConfigHandler);
Hooks.on("renderSettingsConfig", renderSettingsConfigHandler);
