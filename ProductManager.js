

const CartManager = require('./cart-manager');

const Products = require ('./Products.json')

const express = require('express');

const { Router } = express;

const fs = require('fs').promises;

const path = require('path');

const app = express();

const PORT = 8080;

const routerProductos = Router();

const routerCarritos = Router();


app.use(express.json());

app.use(express.urlencoded({ extended: true }));


class ProductManager {
    constructor(filePath) {
        this.path = path.join(__dirname, filePath);
        this.products = [];
        this.nextId = 1;
        this.loadProducts();
    };

    async loadProducts() {
        try {
            const data = await fs.readFile(this.path, 'utf-8');
            this.products = JSON.parse(data);
            if (this.products.length > 0) {
                this.nextId = Math.max(...this.products.map(p => p.id)) + 1;
            }
        }

        catch (error) {
            this.products = [];
            this.nextId = 1;
        }
    };

    async saveProducts() {
        await fs.writeFile(this.path, JSON.stringify(this.products, null, 2), 'utf-8');
    };

    async addProduct(product) {
        if (!product.title || !product.description || !product.code || product.price === undefined || product.stock === undefined || !product.category) {
            throw new Error("Todos los campos son obligatorios.");
        };

        if (this.products.some(p => p.code === product.code)) {
            throw new Error(`Ya existe un producto con el código: ${product.code}`);
        };

        const newProduct = {
            id: this.nextId ++,
            status: true,
        };

        this.products.push(newProduct);
        await this.saveProducts();
        return newProduct;
    }

    async getProducts() {
        return this.products;
    }

    async getProductById(id) {
        return this.products.find(p => p.id === id);
    }

    async updateProduct(id, updatedFields) {
        const index = this.products.findIndex(p => p.id === id);
        if (index === -1) {
            return null;
        }
        updatedFields.id = id; // Aseguramos que el ID no se modifique
        this.products[index] = { ...this.products[index], ...updatedFields };
        await this.saveProducts();
        return this.products[index];
    }

    async deleteProduct(id) {
        const index = this.products.findIndex(p => p.id === id);
        if (index === -1) {
            return false;
        }
        this.products.splice(index, 1);
        await this.saveProducts();
        return true;
    }
}

class CartManager {
    constructor(filePath) {
        this.path = path.join(__dirname, filePath);
        this.carts = [];
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
    }

    async getCartById(id) {
        return this.carts.find(c => c.id === id);
    }

    async addProductToCart(cartId, productId) {

        const cart = await this.getCartById(cartId);
        if (!cart) {
            return null;
        };

        const existingProduct = cart.products.find(item => item.product === productId);
        if (existingProduct) {
            existingProduct.quantity++;
        } else {
            cart.products.push({ product: productId, quantity: 1 });
        }
    }
}

// -
const productManager = new ProductManager('products.json');
const cartManager = new CartManager('carritos.json');

// --
routerProducts.get('/', async (req, res) => {
    try {
        const products = await productManager.getProducts();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

routerProductos.get('/:pid', async (req, res) => {
    const productId = parseInt(req.params.pid);
    const product = await productManager.getProductById(productId);
    if (product) {
        res.json(product);
    } else {
        res.status().json({ error: 'Producto no encontrado' });
    }
});

routerProductos.post('/', async (req, res) => {
    try {
        const newProductData = req.body;

        const newProduct = await productManager.addProduct(newProductData);

        res.status(201).json(newProduct);
    } catch (error) {
        res.status().json({ error: error.message });
    }
});

routerProductos.put('/:pid', async (req, res) => {
    const productId = parseInt(req.params.pid);

    const updatedFields = req.body;

    const updatedProduct = await productManager.updateProduct(productId, updatedFields);
    if (updatedProduct) {
        res.json(updatedProduct);
    } else {
        res.status().json({ error: 'Producto no encontrado' });
    }
});

routerProductos.delete('/:pid', async (req, res) => {
    const productId = parseInt(req.params.pid);

    const deleted = await productManager.deleteProduct(productId);
    if (deleted) {
        res.sendStatus();
    } else {
        res.status(404).json({ error: 'Producto no encontrado' });
    }
});

// ---
routerCarritos.post('/', async (req, res) => {
    try {
        const newCart = await cartManager.createCart();
        res.status(201).json(newCart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

routerCarritos.get('/:cid', async (req, res) => {
    const cartId = parseInt(req.params.cid);
    const cart = await cartManager.getCartById(cartId);
    if (cart) {
        res.json(cart.products);
    } else {
        res.status(404).json({ error: 'Carrito no encontrado' });
    }
});

routerCarritos.post('/:cid/product/:pid', async (req, res) => {
    const cartId = parseInt(req.params.cid);
    const productId = parseInt(req.params.pid);
    const updatedCart = await cartManager.addProductToCart(cartId, productId);
    if (updatedCart) {
        res.json(updatedCart);
    } else {
        res.status(404).json({ error: 'Carrito o producto no encontrado' });
    }
});

//---
app.use('/api/products', routerProductos);
app.use('/api/carts', routerCarritos);
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});