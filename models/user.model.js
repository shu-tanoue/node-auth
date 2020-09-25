const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    cart: {
        //nested schema
        items: [
            {
                productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
                quantity: { type: Number, required: true }
            }
        ]
    }
});

//add to cart
userSchema.methods.addToCart = function(product) {
    //get the array index of the product being added to cart (if it doesnt find it, it will return a '-1' value)
    const cartProductIndex = this.cart.items.findIndex(item => {
        return item.productId.toString() === product._id.toString();
    });
    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];

    if(cartProductIndex >= 0){
        //if item exists in the cart, add the quantity
        newQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
        //if item doesnt exists in the cart, add to updatedcart and give it a quantity of 1
        updatedCartItems.push({
            productId: product._id,
            quantity: newQuantity
        })
    }

    const updatedCart = {
        items: updatedCartItems
    };

    this.cart = updatedCart;
    return this.save();
}

//remove from cart
userSchema.methods.removeFromCart = function(productId){
    const updatedCartItems = this.cart.items.filter(item => {
        return item.productId.toString() !== productId.toString();
    });
    this.cart.items = updatedCartItems;
    return this.save();
}

//clear the cart after ordering
userSchema.methods.clearCart = function(){
    this.cart = { items: [] }
    return this.save();
}

module.exports = mongoose.model('User', userSchema);