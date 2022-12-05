class BaseModel {
    constructor(model) {
        this.model = model
    }

    getModel = () => {
        return this.model
    }

    async create(body, opts = {}) {
        try {
            const data = await this.model.insertMany(body, opts)
            return data
        } catch (error) {
            // console.log(error)
            throw new Error(error)
        }
    }

    async createOne(body, opts = {}) {
        try {
            // console.log(this.model);
            const data = await this.model.create(body)
            return data
        } catch (error) {
            // console.log(error)
            throw new Error(error)
        }
    }

    async updateOne(cond, query, opts = {new: true}) {
        try {
            const data = await this.model.updateOne(cond, query, opts).exec()
            return data
        } catch (error) {
            throw new Error(error)
        }
    }
    async updateMany(cond, query, opts = {new: true}) {
        try {
            const data = await this.model.updateMany(cond, query, opts).exec()
            return data
        } catch (error) {
            throw new Error(error)
        }
    }

    async findOneAndUpdate(cond, query, opts = {new: true}) {
        try {
            const data = await this.model.findOneAndUpdate(cond, query, opts).exec()
            // console.log(`findOneAndUpdate = `, data)
            return data
        } catch (error) {
            throw new Error(error)
        }
    }
    async findAndModify(query, update, sort = {createdAt: -1}, upsert = true) {
        try {
            const data = await this.model
                .findAndModify({
                    query: query,
                    sort: sort,
                    update: update,
                    upsert: upsert,
                })
                .exec()
            console.log(`findAndModify = `, data)
            return data
        } catch (error) {
            throw new Error(error)
        }
    }

    async deleteOne(cond, opts = {}) {
        try {
            const data = await this.model.deleteOne(cond, opts).exec()
            return data
        } catch (error) {
            throw new Error(error)
        }
    }

    async deleteMany(cond, opts = {}) {
        try {
            const data = await this.model.deleteMany(cond, opts).exec()
            return data
        } catch (error) {
            throw new Error(error)
        }
    }

    async findMany(
        cond,
        page = 1,
        limit = 20,
        sort = {createdAt: -1},
        opts = {},
        populate = '',
        select = '',
        session = null,
    ) {
        try {
            limit = parseInt(limit)
            page = parseInt(page)
            let skip = limit * (page - 1)
            let data = null
            if (session) {
                data = await this.model
                    .find(cond, opts)
                    .collation({locale: 'en'})
                    .skip(skip)
                    .limit(limit)
                    .populate(populate)
                    .sort(sort)
                    .select(select)
                    .session(session)
                    .exec()
            } else {
                data = await this.model
                    .find(cond, opts)
                    .collation({locale: 'en'})
                    .skip(skip)
                    .limit(limit)
                    .populate(populate)
                    .sort(sort)
                    .select(select)
                    .exec()
            }
            if (data == null) {
                return []
            }
            return data
        } catch (error) {
            throw new Error(error)
        }
    }

    async findManyAndSelect(cond, select, page = 1, limit = 20, sort = -1) {
        try {
            limit = parseInt(limit)
            page = parseInt(page)
            let skip = limit * (page - 1)
            const data = await this.model
                .find(cond)
                .skip(skip)
                .limit(limit)
                .select(select)
                .sort({createdAt: sort})
                .exec()
            if (data == null) {
                return []
            }
            return data
        } catch (error) {
            throw new Error(error)
        }
    }

    async findOne(cond, opts = {}, populate = '', select = '', lean = false) {
        try {
            const data = lean
                ? await this.model.findOne(cond, opts).populate(populate).select(select).lean()
                : await this.model.findOne(cond, opts).populate(populate).select(select).exec()
            return data
        } catch (error) {
            throw Error(error)
        }
    }

    async findOneAndSort(cond, opts = {}, sort = {}, populate = '', select = '') {
        try {
            const data = await this.model.findOne(cond, opts).populate(populate).select(select).sort(sort).exec()
            return data
        } catch (error) {
            throw Error(error)
        }
    }

    async total(cond = {}) {
        try {
            return await this.model.countDocuments(cond)
        } catch (error) {
            throw new Error(error)
        }
    }
}

module.exports = BaseModel
