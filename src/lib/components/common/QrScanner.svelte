<script lang="ts">
	import { Html5Qrcode } from 'html5-qrcode';
	import Button from '../ui/button/button.svelte';
	import { QrCode, X } from '@lucide/svelte';
	import { tick } from 'svelte';

	let showQRScanner = $state(false);
	let qrScanner: Html5Qrcode | null = null;
	let qrScannerReady = $state(false);

	async function initializeQRScanner() {
		// Show the scanner UI first to render the element
		showQRScanner = true;
		// Wait for DOM to update
		await tick();

		if (!qrScanner) {
			qrScanner = new Html5Qrcode('qr-reader');
		}

		try {
			const cameras = await Html5Qrcode.getCameras();
			if (cameras && cameras.length > 0) {
				await qrScanner.start(
					cameras.length > 1 ? cameras[1].id : cameras[0].id,
					undefined,
					onScanSuccess,
					() => {} // onScanError: Silently ignore QR scanning errors (continuous scanning attempts)
				);
				qrScannerReady = true;
			}
		} catch (err: any) {
			// error = 'Failed to initialize camera for QR scanning';
            console.error('QR Scanner initialization failed:', err);
			showQRScanner = false;
		}
	}

	function onScanSuccess(qrCodeMessage: string) {
		let address = qrCodeMessage.trim();

		// Extract address from ton://transfer/ prefix if present
		const tonTransferMatch = address.match(/ton:\/\/transfer\/(.+)/);
		if (tonTransferMatch) {
			address = tonTransferMatch[1];
		}

		// recipient = address;
		stopQRScanner();
        return address; // todo: fixme
	}

	async function stopQRScanner() {
		if (qrScanner && showQRScanner) {
			try {
				await qrScanner.stop();
				showQRScanner = false;
			} catch (err: any) {
				console.error('Error stopping QR scanner:', err);
			}
		}
	}
</script>

<Button
	variant="ghost"
	size="sm"
	onclick={initializeQRScanner}
	class="h-auto p-1"
	title="Scan QR code"
>
	<QrCode class="h-4 w-4" />
</Button>

<!-- QR Scanner Overlay -->
{#if showQRScanner}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
		<div class="relative w-full max-w-sm">
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-semibold text-white">Scan QR Code</h3>
					<Button variant="ghost" size="sm" onclick={stopQRScanner} class="h-auto p-1">
						<X class="h-5 w-5" />
					</Button>
				</div>
				<div id="qr-reader" class="w-full rounded-lg"></div>
				{#if !qrScannerReady}
					<p class="text-center text-sm text-gray-300">Initializing camera...</p>
				{/if}
				<p class="text-center text-xs text-gray-400">Position QR code in the frame</p>
			</div>
		</div>
	</div>
{/if}
