import mongoose from "mongoose";
import userModel from "../models/userModel.js"

// Cart keys must be real food ids (a plain string), never an object or something like "__proto__"
const isFoodId = (value) => typeof value === "string" && mongoose.isValidObjectId(value);

// add to user cart  
const addToCart = async (req, res) => {
   const userId = String(req.body.userId);
   const itemId = req.body.itemId;
   if (!isFoodId(itemId)) {
      return res.json({ success: false, message: "Invalid item" });
   }
   try {
      let userData = await userModel.findById(userId);
      let cartData = await userData.cartData;
      if (!cartData[itemId]) {
         cartData[itemId] = 1;
      }
      else {
         cartData[itemId] += 1;
      }
      await userModel.findByIdAndUpdate(userId, {cartData});
      res.json({ success: true, message: "Added To Cart" });
   } catch (error) {
      console.log(error);
      res.json({ success: false, message: "Error" })
   }
}

// remove food from user cart
const removeFromCart = async (req, res) => {
   const userId = String(req.body.userId);
   const itemId = req.body.itemId;
   if (!isFoodId(itemId)) {
      return res.json({ success: false, message: "Invalid item" });
   }
   try {
      let userData = await userModel.findById(userId);
      let cartData = await userData.cartData;
      if (cartData[itemId] > 0) {
         cartData[itemId] -= 1;
      }
      await userModel.findByIdAndUpdate(userId, {cartData});
      res.json({ success: true, message: "Removed From Cart" });
   } catch (error) {
      console.log(error);
      res.json({ success: false, message: "Error" })
   }

}

// get user cart
const getCart = async (req, res) => {
   try {
      let userData = await userModel.findById(String(req.body.userId));
      let cartData = await userData.cartData;
      res.json({ success: true, cartData:cartData });
   } catch (error) {
      console.log(error);
      res.json({ success: false, message: "Error" })
   }
}


export { addToCart, removeFromCart, getCart }