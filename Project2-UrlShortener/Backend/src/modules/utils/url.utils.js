import { customAlphabet } from "nanoid";
import { Url } from "../url/url.model.js";

const nanoid = customAlphabet(
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    7
);

export async function generateShortCode() {
    let slug;
    let exists = true;

    while (exists) {
        slug = nanoid();
        exists = await Url.exists({ shortcode: slug });
    }

    return slug;
}