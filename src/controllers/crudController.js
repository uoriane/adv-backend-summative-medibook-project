const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { parseId } = require('../utils/validation');

function createCrudController({ model, validate, label, basePath }) {
  async function findOrFail(rawId) {
    const record = await model.findById(parseId(rawId));
    if (!record) {
      throw new AppError(404, `${label} not found`);
    }
    return record;
  }

  const list = asyncHandler(async (req, res) => {
    res.json(await model.findAll());
  });

  const getOne = asyncHandler(async (req, res) => {
    res.json(await findOrFail(req.params.id));
  });

  const create = asyncHandler(async (req, res) => {
    const data = validate(req.body);
    const id = await model.create(data);
    res.status(201).location(`${basePath}/${id}`).json(await model.findById(id));
  });

  const update = asyncHandler(async (req, res) => {
    const existing = await findOrFail(req.params.id);
    await model.update(existing.id, validate(req.body));
    res.json(await model.findById(existing.id));
  });

  const remove = asyncHandler(async (req, res) => {
    const existing = await findOrFail(req.params.id);
    await model.remove(existing.id);
    res.status(204).end();
  });

  return { list, getOne, create, update, remove };
}

module.exports = createCrudController;
