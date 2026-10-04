<script>
	import { focusService } from "@/services/focus.js"
	export default {
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			try { focusService.snapshot() } catch (error) { console.warn(error.message) }
		},
		onHide: function() {
			try { focusService.snapshot(true) } catch (error) { console.warn(error.message) }
		}
	}
</script>

<style>
	/*每个页面公共css */
</style>
