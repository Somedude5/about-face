import { IndicatorMode, MODULE_ID } from "./settings.js";
import flipAngles from "./flipAngles.js";

let indicatorColor, indicatorDistance;

const IndicatorDirections = {
	up: -90,
	right: 0,
	down: 90,
	left: 180,
};
const TokenDirections = {
	down: 0,
	right: 90,
	up: 180,
	left: 270,
};

export function drawAboutFaceIndicator(wrapped, ...args) {
	if (!canvas.scene.getFlag(MODULE_ID, "sceneEnabled")) {
		wrapped(...args);
		return;
	}
	try {
		//get the rotation of the token
		let dir = this.data.flags[MODULE_ID]?.direction ?? getIndicatorDirection(this) ?? 90;
		const indicatorSize = [1, 1.5][game.settings.get(MODULE_ID, "sprite-type")];
		//calc distance
		const r = (Math.max(this.w, this.h) / 2) * indicatorDistance;
		//calc scale
		const scale = Math.max(this.data.width, this.data.height) * this.data.scale * indicatorSize;
		if (!this.aboutFaceIndicator || this.aboutFaceIndicator._destroyed) {
			const container = new PIXI.Container();
			container.name = "aboutFaceIndicator";
			container.width = this.w;
			container.height = this.h;
			container.x = this.w / 2;
			container.y = this.h / 2;
			const graphics = new PIXI.Graphics();
			//draw an arrow indicator
			drawArrow(graphics);
			//place the arrow in the correct position
			container.angle = dir;
			graphics.x = r;
			graphics.scale.set(scale, scale);
			//add the graphics to the container
			container.addChild(graphics);
			container.graphics = graphics;
			this.aboutFaceIndicator = container;
			//add the container to the token
			this.addChild(container);
		} else {
			let container = this.aboutFaceIndicator;
			let graphics = container.graphics;
			graphics.x = r;
			graphics.scale.set(scale, scale);
			//update the rotation of the arrow
			container.angle = dir;
		}
		const indicatorState = game.settings.get(MODULE_ID, "indicator-state");
		if (indicatorState == IndicatorMode.OFF || this.document.getFlag(MODULE_ID, "indicatorDisabled")) this.aboutFaceIndicator.graphics.visible = false;
		else if (indicatorState == IndicatorMode.HOVER) this.aboutFaceIndicator.graphics.visible = this._hover;
		else if (indicatorState == IndicatorMode.ALWAYS) this.aboutFaceIndicator.graphics.visible = true;
	} catch (error) {
		console.error(error);
	}
	wrapped(...args);
}

function drawArrow(graphics) {
	const color = `0x${indicatorColor.substring(1, 7)}` || ``;
	graphics.beginFill(color, 0.5).lineStyle(2, color, 1).moveTo(0, 0).lineTo(0, -10).lineTo(10, 0).lineTo(0, 10).lineTo(0, 0).closePath().endFill();
}

export async function onCanvasReady() {
	if (canvas.scene.data?.flags?.[MODULE_ID] == undefined) {
		canvas.scene.setFlag(MODULE_ID, "sceneEnabled", true);
	}
}

export function onPreCreateToken(document, data, options, userId) {
	const updates = { flags: {} };
	const facingDirection = game.settings.get(MODULE_ID, "facing-direction");
	if (canvas.scene.getFlag(MODULE_ID, "lockRotation")) {
		updates.lockRotation = true;
	}
	if (facingDirection) {
		// updates.direction = TokenDirections[facingDirection];
		// updates.flags[MODULE_ID] = { direction: TokenDirections[facingDirection] };
	}
	if (Object.keys(updates).length) document.data.update(updates);
}

export function onPreUpdateToken(token, updates) {
	if (!canvas.scene.getFlag(MODULE_ID, "sceneEnabled")) return;
	const flipOrRotate = getFlipOrRotation(token);
	if ("rotation" in updates) {
		var dir = updates.rotation + 90;
		//store the direction in the token data
		if (!updates.flags) updates.flags = {};
		updates.flags[MODULE_ID] = { direction: dir };
		if (flipOrRotate != "rotate") {
			const [mirrorKey, mirrorVal] = getMirror(token, flipOrRotate, dir);
			if (mirrorKey) updates[mirrorKey] = mirrorVal;
			return;
		}
	} else if ("x" in updates || "y" in updates) {
		//get previews and new positions
		const prevPos = { x: token.data.x, y: token.data.y };
		const newPos = { x: updates.x ?? token.data.x, y: updates.y ?? token.data.y };
		//get the direction in degrees of the movement
		let diffY = newPos.y - prevPos.y;
		let diffX = newPos.x - prevPos.x;
		dir = (Math.atan2(diffY, diffX) * 180) / Math.PI;
		//store the direction in the token data
		if (!updates.flags) updates.flags = {};
		updates.flags[MODULE_ID] = { direction: dir };
		if (flipOrRotate != "rotate") {
			const [mirrorKey, mirrorVal] = getMirror(token, flipOrRotate, dir + 90);
			if (mirrorKey) updates[mirrorKey] = mirrorVal;
			return;
		}
	} else return;
	//update the rotation of the token
	updates.rotation = dir - 90;
}

/////////////
// HELPERS //
/////////////

function getDirection(token) {
	return token.document.getFlag(MODULE_ID, "facingDirection") || game.settings.get(MODULE_ID, "facing-direction");
}

function getIndicatorDirection(token) {
	return IndicatorDirections[getDirection(token)];
}

function getTokenDirection(token) {
	return TokenDirections[getDirection(token)];
}

function getFlipOrRotation(tokenDocument) {
	const tokenFlipOrRotate = tokenDocument.getFlag(MODULE_ID, "flipOrRotate") || "global";
	return tokenFlipOrRotate != "global" ? tokenFlipOrRotate : game.settings.get(MODULE_ID, "flip-or-rotate");
}

function getMirror(tokenDocument, flipOrRotate, dir) {
	if (dir == null) dir = tokenDocument.getFlag(MODULE_ID, "direction") || 0;
	const facingDirection = tokenDocument.getFlag(MODULE_ID, "facingDirection") || game.settings.get(MODULE_ID, "facing-direction");
	let angles = flipAngles[canvas.grid.type][flipOrRotate][facingDirection];
	if (angles[dir] != null) {
		const update = {
			[angles.mirror]: angles[dir],
		};
		return [angles.mirror, angles[dir]];
	}
	return [];
}

export function updateArrowColor(color) {
	indicatorColor = color;
}

export function updateArrowDistance(distance) {
	indicatorDistance = distance;
}

export function updateSettings() {
	indicatorColor = game.settings.get(MODULE_ID, "arrowColor");
	indicatorDistance = game.settings.get(MODULE_ID, "arrowDistance");
}
