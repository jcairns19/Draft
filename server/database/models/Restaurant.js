import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Restaurant = sequelize.define('Restaurant', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slogan: {
      type: DataTypes.TEXT,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    image_url: {
      type: DataTypes.TEXT,
    },
    open_time: {
      type: DataTypes.TIME,
    },
    close_time: {
      type: DataTypes.TIME,
    },
    manager_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'restaurants',
    timestamps: false, // No updated_at in SQL
    indexes: [
      {
        fields: ['manager_id'],
      },
    ],
  });

  Restaurant.associate = (models) => {
    Restaurant.belongsTo(models.User, { foreignKey: 'manager_id', as: 'manager' });
    Restaurant.hasMany(models.Tab, { foreignKey: 'restaurant_id', onDelete: 'CASCADE' });
    Restaurant.hasMany(models.RestaurantMenuItem, { foreignKey: 'restaurant_id', onDelete: 'CASCADE' });
    Restaurant.belongsToMany(models.MenuItem, {
      through: models.RestaurantMenuItem,
      foreignKey: 'restaurant_id',
      otherKey: 'menu_item_id',
    });
  };

  return Restaurant;
};