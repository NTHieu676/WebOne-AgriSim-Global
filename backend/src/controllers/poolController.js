const swapService = require("../services/swapService");
async function preview(req, res, next) { try { const data = await swapService.preview(req.user.uid, req.body || {}); return res.status(200).json({ success: true, data }); } catch (error) { return next(error); } }
async function swap(req, res, next) { try { const data = await swapService.swap(req.user.uid, req.body || {}); return res.status(200).json({ success: true, data }); } catch (error) { return next(error); } }
module.exports = { preview, swap };
