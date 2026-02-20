"""
Preparación del dataset maestro para predicción de reseñas negativas en Olist.
Pregunta de negocio: ¿Qué factores logísticos y económicos influyen más en la
probabilidad de que un pedido reciba una reseña negativa (1-2 estrellas)?
"""

import pandas as pd
import numpy as np
from math import radians, cos, sin, asin, sqrt
import warnings
warnings.filterwarnings('ignore')

def haversine(lon1, lat1, lon2, lat2):
    """Calcula distancia en km entre dos coordenadas."""
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    return 6371 * c

def load_and_merge_data(data_path="data/raw/"):
    """Carga y une todas las tablas de Olist."""
    
    # Cargar datasets
    orders = pd.read_csv(f"{data_path}olist_orders_dataset.csv")
    items = pd.read_csv(f"{data_path}olist_order_items_dataset.csv")
    reviews = pd.read_csv(f"{data_path}olist_order_reviews_dataset.csv")
    payments = pd.read_csv(f"{data_path}olist_order_payments_dataset.csv")
    products = pd.read_csv(f"{data_path}olist_products_dataset.csv")
    sellers = pd.read_csv(f"{data_path}olist_sellers_dataset.csv")
    customers = pd.read_csv(f"{data_path}olist_customers_dataset.csv")
    categories = pd.read_csv(f"{data_path}product_category_name_translation.csv")
    geolocation = pd.read_csv(f"{data_path}olist_geolocation_dataset.csv")
    
    print(f"Orders: {orders.shape}")
    print(f"Items: {items.shape}")
    print(f"Reviews: {reviews.shape}")
    print(f"Payments: {payments.shape}")
    print(f"Products: {products.shape}")
    print(f"Sellers: {sellers.shape}")
    print(f"Customers: {customers.shape}")
    
    # Traducir categorías
    products = products.merge(categories, on='product_category_name', how='left')
    
    # Agregar items a nivel de orden
    items_agg = items.groupby('order_id').agg(
        total_items=('order_item_id', 'count'),
        total_price=('price', 'sum'),
        total_freight=('freight_value', 'sum'),
        avg_price=('price', 'mean'),
        avg_freight=('freight_value', 'mean'),
        n_sellers=('seller_id', 'nunique')
    ).reset_index()
    
    # Agregar pagos a nivel de orden
    payments_agg = payments.groupby('order_id').agg(
        total_payment=('payment_value', 'sum'),
        n_installments=('payment_installments', 'max'),
        n_payment_types=('payment_type', 'nunique'),
        main_payment_type=('payment_type', 'first')
    ).reset_index()
    
    # Tomar la primera reseña por orden (algunas tienen duplicados)
    reviews_unique = reviews.drop_duplicates(subset='order_id', keep='first')
    
    # Merge principal
    df = orders.merge(reviews_unique[['order_id', 'review_score', 'review_comment_title', 
                                       'review_comment_message']], on='order_id', how='inner')
    df = df.merge(items_agg, on='order_id', how='left')
    df = df.merge(payments_agg, on='order_id', how='left')
    df = df.merge(customers[['customer_id', 'customer_city', 'customer_state', 
                              'customer_zip_code_prefix']], on='customer_id', how='left')
    
    # Agregar info del primer producto y vendedor de cada orden
    first_item = items.drop_duplicates(subset='order_id', keep='first')[
        ['order_id', 'product_id', 'seller_id']
    ]
    df = df.merge(first_item, on='order_id', how='left')
    df = df.merge(products[['product_id', 'product_category_name_english',
                             'product_weight_g', 'product_length_cm',
                             'product_height_cm', 'product_width_cm',
                             'product_photos_qty', 'product_description_lenght',
                             'product_name_lenght']], on='product_id', how='left')
    df = df.merge(sellers[['seller_id', 'seller_city', 'seller_state',
                            'seller_zip_code_prefix']], on='seller_id', how='left')
    
    print(f"\nDataset merged: {df.shape}")
    return df, geolocation

def create_features(df, geolocation):
    """Crea features para el modelo."""
    
    # ---------- Variables temporales ----------
    date_cols = ['order_purchase_timestamp', 'order_approved_at', 
                 'order_delivered_carrier_date', 'order_delivered_customer_date',
                 'order_estimated_delivery_date']
    for col in date_cols:
        df[col] = pd.to_datetime(df[col], errors='coerce')
    
    # Días de retraso (positivo = tarde, negativo = temprano)
    df['delivery_delay_days'] = (
        df['order_delivered_customer_date'] - df['order_estimated_delivery_date']
    ).dt.total_seconds() / 86400
    
    # Tiempo total de entrega (días)
    df['delivery_time_days'] = (
        df['order_delivered_customer_date'] - df['order_purchase_timestamp']
    ).dt.total_seconds() / 86400
    
    # Tiempo de despacho del vendedor
    df['seller_dispatch_days'] = (
        df['order_delivered_carrier_date'] - df['order_approved_at']
    ).dt.total_seconds() / 86400
    
    # Tiempo en tránsito
    df['carrier_transit_days'] = (
        df['order_delivered_customer_date'] - df['order_delivered_carrier_date']
    ).dt.total_seconds() / 86400
    
    # Día de la semana y hora de compra
    df['purchase_dayofweek'] = df['order_purchase_timestamp'].dt.dayofweek
    df['purchase_hour'] = df['order_purchase_timestamp'].dt.hour
    
    # ---------- Variables geográficas ----------
    # Promedio de coordenadas por zip_code_prefix
    geo_avg = geolocation.groupby('geolocation_zip_code_prefix').agg(
        lat=('geolocation_lat', 'mean'),
        lng=('geolocation_lng', 'mean')
    ).reset_index()
    
    # Coordenadas del cliente
    df = df.merge(
        geo_avg.rename(columns={'geolocation_zip_code_prefix': 'customer_zip_code_prefix',
                                 'lat': 'customer_lat', 'lng': 'customer_lng'}),
        on='customer_zip_code_prefix', how='left'
    )
    
    # Coordenadas del vendedor
    df = df.merge(
        geo_avg.rename(columns={'geolocation_zip_code_prefix': 'seller_zip_code_prefix',
                                 'lat': 'seller_lat', 'lng': 'seller_lng'}),
        on='seller_zip_code_prefix', how='left'
    )
    
    # Distancia vendedor-cliente
    mask = df['customer_lat'].notna() & df['seller_lat'].notna()
    df.loc[mask, 'distance_km'] = df.loc[mask].apply(
        lambda r: haversine(r['customer_lng'], r['customer_lat'],
                           r['seller_lng'], r['seller_lat']), axis=1
    )
    
    # ---------- Variables de texto ----------
    df['has_comment'] = df['review_comment_message'].notna().astype(int)
    df['comment_length'] = df['review_comment_message'].fillna('').str.len()
    
    # ---------- Variables de producto ----------
    df['product_volume_cm3'] = (
        df['product_length_cm'] * df['product_height_cm'] * df['product_width_cm']
    )
    df['freight_ratio'] = df['total_freight'] / (df['total_price'] + 1)
    
    # ---------- Variable objetivo: reseña negativa (1-2 estrellas) ----------
    df['is_negative'] = (df['review_score'] <= 2).astype(int)
    
    # ---------- Filtrar solo órdenes entregadas ----------
    df = df[df['order_status'] == 'delivered'].copy()
    
    print(f"\nDataset final (solo entregados): {df.shape}")
    print(f"Distribución target:")
    print(df['is_negative'].value_counts(normalize=True).round(3))
    
    return df

def select_model_features(df):
    """Selecciona las features para el modelo y maneja valores faltantes."""
    
    feature_cols = [
        # Logística
        'delivery_delay_days',
        'delivery_time_days', 
        'seller_dispatch_days',
        'carrier_transit_days',
        # Económicas
        'total_price',
        'total_freight',
        'freight_ratio',
        'n_installments',
        'total_items',
        # Producto
        'product_weight_g',
        'product_volume_cm3',
        'product_photos_qty',
        'product_description_lenght',
        # Geográficas
        'distance_km',
        # Temporal
        'purchase_dayofweek',
        'purchase_hour',
        # Otras
        'n_sellers',
    ]
    
    target = 'is_negative'
    
    # Filtrar filas con target no nulo
    df_model = df[feature_cols + [target]].copy()
    
    # Imputar valores faltantes con la mediana
    for col in feature_cols:
        median_val = df_model[col].median()
        df_model[col] = df_model[col].fillna(median_val)
    
    print(f"\nFeatures seleccionadas: {len(feature_cols)}")
    print(f"Shape final para modelo: {df_model.shape}")
    print(f"Valores faltantes por columna:")
    print(df_model.isnull().sum())
    
    return df_model, feature_cols, target


if __name__ == "__main__":
    # Ejecutar pipeline completo
    df, geo = load_and_merge_data("data/raw/")
    df = create_features(df, geo)
    df_model, feature_cols, target = select_model_features(df)
    
    # Guardar dataset procesado
    df.to_csv("data/processed/olist_master_dataset.csv", index=False)
    df_model.to_csv("data/processed/olist_model_dataset.csv", index=False)
    
    print("\n✅ Datasets guardados en data/processed/")
