import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const PaymentMethod = sequelize.define('PaymentMethod', {
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
    card_number: {
      type: DataTypes.STRING(25),
      allowNull: false,
    },
    card_cvc: {
      type: DataTypes.STRING(4),
      allowNull: false,
    },
    card_holder_name: {
      type: DataTypes.STRING(255),
    },
    card_brand: {
      type: DataTypes.STRING(50),
    },
    card_exp_month: {
      type: DataTypes.INTEGER,
    },
    card_exp_year: {
      type: DataTypes.INTEGER,
    },
    billing_address: {
      type: DataTypes.JSONB,
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'payment_methods',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id'],
      },
    ],
  });

  PaymentMethod.associate = (models) => {
    PaymentMethod.belongsTo(models.User, { foreignKey: 'user_id' });
    PaymentMethod.hasMany(models.Tab, { foreignKey: 'payment_method_id', onDelete: 'SET NULL' });
  };

  return PaymentMethod;
};