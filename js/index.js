let keys = location.hash.slice(1).split(":");

console.log(keys);

function showElement(id) {
	document.getElementById(id)?.classList.remove("hidden");
}

function setElementText(id, text) {
	document.getElementById(id).innerText = text;
}

async function main() {
	if(keys.length != 2)
		return showElement("explainer");

	try {
		let data = await (await fetch(`data/${keys[0]}`)).arrayBuffer();
		let encryptionKey = await window.crypto.subtle.importKey(
			"jwk",
			{ k: keys[1], alg: "A128GCM", ext: true, key_ops: ["encrypt", "decrypt"], kty: "oct" },
			{ name: "AES-GCM", length: 128 },
			false, // extractable
			["decrypt"],
		).catch(_ => showElement("error"));

		const decrypted = await window.crypto.subtle.decrypt(
			{ name: "AES-GCM", iv: new Uint8Array(12) },
			encryptionKey,
			data,
		).catch(_ => showElement("error"));
		const decoded = new TextDecoder().decode(new Uint8Array(decrypted));

		console.log(decoded);

		if(!decoded.startsWith("#IOU#"))
			return showElement("error");

		let parsed = JSON.parse(decoded.slice(5));

		document.title = `IOU for ${parsed.for ?? "someone..."}`;

		setElementText("name", parsed.for ?? "(name?)");
		setElementText("subject", parsed.subject ?? "(subject?)");
		setElementText("message", parsed.message ?? "(message?)");

		if(parsed.due !== undefined) {
			let dueDate = new Date(parsed.due);
			if(!isNaN(dueDate.getDate())) {
				setElementText("due", dueDate.toISOString().split("T")[0]);
				showElement("due-outer");
			}
		}

		showElement("iou");
	} catch (e) {
		console.error(e);
	} finally { return false; }
}

main();