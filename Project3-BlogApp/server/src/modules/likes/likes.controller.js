import { Post } from "../post/post.model";
import { Likes } from "./likes.model";

export async function toggleLike (req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid comment id"
            });
        }

        const post = await Post.findOne({_id: id, isDeleted: false});

        if (!post) {
            return res.status(404).json({
                message: "Post does not exists"
            });
        }

        const existingLike = await Likes.findOne({ post: post._id, user: req.user.id });

        let liked;
        if (existingLike) {
            await existingLike.deleteOne();
            liked = false;
        } else {
            await Likes.create({
                post: post._id,
                user: req.user.id
            });
            liked = true
        }

        const likeCount = await Likes.countDocuments({ post: post._id });

        return res.status(200).json({
            message: liked ? "Post liked" : "Post unliked",
            liked,
            likeCount
        });

    } catch (error ) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    } 

}

export async function getLikers (req, res) {
    try {

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid comment id"
            });
        }

        const post = await Post.findOne({_id: id, isDeleted: false});

        if (!post) {
            return res.status(404).json({
                message: "Post does not exists"
            });
        }

        const likes = await Likes.find({ post: post._id })
            .populate("user", "username")
            .sort({ createdAt: -1 })
            .lean()

        return res.status(200).json({
            message: "Likers fetched successfully",
            users: likes.map((like) => like.user)
        });
        
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
}