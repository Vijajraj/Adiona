from app.services.grid_snap import snap_to_grid

def test_grid_snap_basic():
    lat = 13.0827123
    lng = 80.2707456
    grid_lat, grid_lng = snap_to_grid(lat, lng)

    # Snapped coords should be rounded to 7 decimal places
    assert isinstance(grid_lat, float)
    assert isinstance(grid_lng, float)

    # Snapped distance from original should be <= half grid step (~50m)
    # 0.000898 / 2 ≈ 0.00045 degrees
    assert abs(grid_lat - lat) < 0.0005
    assert abs(grid_lng - lng) < 0.0005

def test_grid_snap_idempotent():
    lat = 13.0475
    lng = 80.2824
    snap1_lat, snap1_lng = snap_to_grid(lat, lng)
    snap2_lat, snap2_lng = snap_to_grid(snap1_lat, snap1_lng)

    assert snap1_lat == snap2_lat
    assert snap1_lng == snap2_lng

def test_points_within_same_100m_cell_snap_to_same_coords():
    # Two points 20 meters apart (~0.00018 degrees)
    lat1, lng1 = 13.082700, 80.270700
    lat2, lng2 = 13.082715, 80.270710

    snap1_lat, snap1_lng = snap_to_grid(lat1, lng1)
    snap2_lat, snap2_lng = snap_to_grid(lat2, lng2)

    assert snap1_lat == snap2_lat
    assert snap1_lng == snap2_lng
