import * as Service from "../services/companyServices.js";
export const createProduct = async (req, res) => {
    try {
        const user = req.user;
        const company = await Service.getCompanyByUserId(user.id);
        if (!company)
            return res.status(403).json({ message: "Company not found" });
        const product = await Service.createProduct({
            company_id: company.id,
            name: req.body.name,
            price: req.body.price,
            discount_price: req.body.discount_price,
            qty: req.body.qty,
            image_url: req.body.image_url,
            description: req.body.description,
        });
        res.json(product);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create product" });
    }
};
export const getCompanyProducts = async (req, res) => {
    try {
        const products = await Service.getProductsByCompany(Number(req.params.companyId));
        res.json(products);
    }
    catch {
        res.status(500).json({ message: "Failed to fetch products" });
    }
};
export const updateProduct = async (req, res) => {
    try {
        const updated = await Service.updateProduct(Number(req.params.id), req.body);
        if (!updated)
            return res.status(404).json({ message: "Product not found" });
        res.json({ message: "Product updated" });
    }
    catch {
        res.status(500).json({ message: "Failed to update product" });
    }
};
export const deleteProduct = async (req, res) => {
    try {
        const deleted = await Service.deleteProduct(Number(req.params.id));
        if (!deleted)
            return res.status(404).json({ message: "Product not found" });
        res.json({ message: "Product deleted" });
    }
    catch {
        res.status(500).json({ message: "Failed to delete product" });
    }
};
export const getCompanyProfile = async (req, res) => {
    try {
        const company = await Service.getCompanyProfileService(req.user.id);
        if (!company)
            return res.status(404).json({ message: "Company not found" });
        res.json(company);
    }
    catch {
        res.status(500).json({ message: "Error fetching company profile" });
    }
};
export const updateCompany = async (req, res) => {
    try {
        const { name, location, type, established_year } = req.body;
        await Service.updateCompanyService(req.user.id, name, location, type, established_year);
        res.json({ message: "Company updated" });
    }
    catch {
        res.status(500).json({ message: "Error updating company" });
    }
};
