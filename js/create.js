document.getElementById("main-body").classList.remove("hidden");

let hashid = new window.Hashids();

function setField(id, value) {
	let el = document.getElementById(id).value = value;
}

function getField(id) {
	return document.getElementById(id).value;
}

function getCheck(id) {
	return document.getElementById(id).checked;
}

function regenID() {
	let id = hashid.encode(Date.now());
	setField("iou-id", id);
	regenLink();
}

let key;
async function regenKey() {
	key = await window.crypto.subtle.generateKey(
		{ name: "AES-GCM", length: 128 },
		true, // extractable
		["encrypt", "decrypt"],
	);
	let keyString = (await window.crypto.subtle.exportKey("jwk", key)).k;
	setField("iou-key", keyString);
	regenLink();
}

function regenLink() {
	let i = getField("iou-id");
	let k = getField("iou-key");
	setField("iou-link", `#${i}:${k}`);
}

function copyLink() {
	let linkField = document.getElementById("iou-link");

	linkField.select();
	linkField.setSelectionRange(0, 99999); // For mobile devices

	navigator.clipboard.writeText(linkField.value);
}

function toggleHasDue() {
	document.getElementById("iou-due").disabled = !getCheck("iou-has-due");
	document.getElementById("iou-due").required = getCheck("iou-has-due");
}

regenID();
regenKey();

async function downloadIOU() {
	let form = document.getElementById("iou-form");
	if(form instanceof HTMLFormElement && !form.checkValidity()) {
		return form.reportValidity();
	}

	let data = {
		for: getField("iou-for"),
		subject: `${getField("iou-subject-prefix")} ${getField("iou-subject")}`.trim(),
		message: getField("iou-message"),
		expiry: getCheck("iou-has-due") ? getField("iou-due") : undefined
	}

	let encrypted = await window.crypto.subtle.encrypt(
		{ name: "AES-GCM", iv: new Uint8Array(12) /* don't reuse key! */ },
		key,
		new TextEncoder().encode("#IOU#"+JSON.stringify(data)),
	);

	let blob = new Blob([encrypted], {type: "Application/octet-stream"});

	let link = document.getElementById("dl");
	link.href = URL.createObjectURL(blob);
	link.download = getField("iou-id");
	link.click();

	copyLink();
}

function dummyHandler(e) {
	e.preventDefault();
}