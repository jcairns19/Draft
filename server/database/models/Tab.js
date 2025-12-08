import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Tab = sequelize.define('Tab', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    restaurant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'restaurants',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    payment_method_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'payment_methods',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    open_time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    close_time: {
      type: DataTypes.DATE,
    },
    is_open: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'tabs',
    timestamps: false, // No updated_at
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['restaurant_id'],
      },
      {
        fields: ['payment_method_id'],
      },
    ],
  });

  Tab.associate = (models) => {
    Tab.belongsTo(models.User, { foreignKey: 'user_id' });
    Tab.belongsTo(models.Restaurant, { foreignKey: 'restaurant_id' });
    Tab.belongsTo(models.PaymentMethod, { foreignKey: 'payment_method_id' });
    Tab.hasMany(models.TabItem, { foreignKey: 'tab_id', onDelete: 'CASCADE' });
  };

  return Tab;
};