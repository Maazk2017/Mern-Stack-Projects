import { generateShortCode } from "../utils/url.utils.js";

import { Url } from "./url.model.js";
import { Click } from "./click.model.js";

export async function createShortUrl (req, res) {
    try {
        const { originalurl, expireat, customslug  } = req.body;

        let shortCode
        if (customslug) {
            shortCode = customslug;
        } else {
            shortCode =  await generateShortCode(originalurl);
        }
        
        const newUrl = await Url.create({
            originalurl: originalurl,
            shortcode: shortCode,
            user: req.user.id || req.user._id,
            expireat: expireat || null
        });

        return res.status(201).json({
            message: "Short url created successfully",
            shortcode: shortCode
        });

    } catch (error) {
        res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
} 

export async function redirectToOriginal (req, res) {
    try {

        const { slug } = req.params;

        if (!slug) {
            return res.status(400).json({
                message: "A slug is needed"
            });
        }

        const url = await Url.findOne({ shortcode: slug });

        if (!url) {
            return res.status(404).json({
                message: "Short URL not found"
            });
        }

        if (url.expireat && url.expireat < new Date()) {
            return res.status(410).json({
                message: "This short link has expired"
            });
        }

        // fire-and-forget — don't await, don't block the redirect
        Click.create({
            url: url._id,
            referrer: req.get("referrer"),
            useragent: req.get("user-agent"),
            ip: req.ip
        }).catch(err => console.error("Failed to log click: ", err));

        // Increment total clicks count in background
        Url.findByIdAndUpdate(url._id, { $inc: { clicks: 1} })
            .catch(err => console.error("Failed to increment clicks: ", err));

        return res.redirect(302, url.originalurl);

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
}

export async function getStats (req, res) {
    try {

        const url = req.urlDoc;

        const trafficSources = await Click.aggregate([
            {$match: {url: url._id}},
            {$group: {_id: "$referrer", count: { $sum: 1 }}},
            {$project: {referrer: "$_id", count: 1, _id: 0}},
            {$sort: {count: -1}}
        ]);

        const dailyClicks = await Click.aggregate([
            {$match: {url: url._id}},
            {
                $group: {
                    _id: {$dateToString: {format: "%Y-%m-%d", date: "$timestamp"}},
                    count: {$sum: 1}
                }
            },

            {$project: {date: "$_id", count: 1, _id: 0}},
            {$sort: {date: 1}}
        ]);

        return res.status(200).json({
            message: "Stats successfully fetched",
            stats: {
                originalurl: url.originalurl,
                shortcode: url.shortcode,
                totalClicks: url.clicks,
                trafficSources,
                dailyClicks
            }
        });


    } catch (error) {
        res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
}

export async function deleteSlug (req, res) {
    try {

        const url = req.urlDoc;

        await Url.deleteOne({ shortcode: url.shortcode });

        await Click.deleteMany({ url: url._id });

        return res.status(200).json({
            message: "Slug/Shortcode deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
}

export async function getAllSlugs (req, res) {
    try {

        const userId = req.user.id 

        const urls = await Url.find({ user: userId }).sort({ createdAt: -1 });

        if (!urls.length) {
            return res.status(200).json({
                message: "No Slug/Shortcode found",
                count: 0,
                urls: []
            });
        }

        return res.status(200).json({
            message: "All Slugs/Shortcode found successfully",
            count: urls.length,
            urls
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
}