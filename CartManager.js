
const fs = require('fs').promises;
const path = require('path');

class CartManager {
    constructor(filePath) {
        this.path = path.join(__dirname, filePath);
        this.nextId = 1;
        this.loadCarts(); 
    }

    async loadCarts() {
        try {
            const data = await fs.readFile(this.path, 'utf-8');
            this.carts = JSON.parse(data);
            if (this.carts.length > 0) {
                this.nextId = Math.max(...this.carts.map(c => c.id)) + 1;
            }
        } catch (error) {
            this.carts = [];
            this.nextId = 1;
        }
    }

    async saveCarts() {
        await fs.writeFile(this.path, JSON.stringify(this.carts, null, 2), 'utf-8');
    }

    async createCart() {
        const newCart = {
            id: this.nextId++,
            products: []
        };

        this.carts.push(newCart);
        await this.saveCarts();
        return newCart;
    };

    async getCartById(id) {
        return this.carts.find(c => c.id === id);
    };

    async addProductToCart(cartId, productId) {
        const cart = await this.getCartById(cartId);
        if (!cart) {
            return null; // El carrito no existe
        };

        const existingProduct = cart.products.find(item => item.product === productId);

        if (existingProduct) {
            existingProduct.quantity++;
        } else {
            cart.products.push({ product: productId, quantity: 1 });
        };

        await this.saveCarts();
        return cart;
    }
}

module.exports = CartManager